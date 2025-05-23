import type {PageFiltersStringified} from 'sentry/components/organizations/pageFilters/types';
import type {Release} from 'sentry/types/release';
import {FieldKey} from 'sentry/utils/fields';
import {useApiQuery} from 'sentry/utils/queryClient';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';

export default function useOrganizationReleases({
  dateRange,
  filters,
}: {
  filters: string[];
  dateRange?: Pick<PageFiltersStringified, 'start' | 'end' | 'statsPeriod'>;
}) {
  const location = useLocation();
  const organization = useOrganization();

  const locationWithoutWidth = {
    ...location,
    query: {
      ...location.query,
      ...dateRange,
      width: undefined,
    },
  };

  let finalizedQuery;
  const hasFinalized = filters.includes('Finalized');
  const hasNotFinalized = filters.includes('Not Finalized');

  if (hasFinalized && !hasNotFinalized) {
    finalizedQuery = 'finalized:true';
  } else if (!hasFinalized && hasNotFinalized) {
    finalizedQuery = 'finalized:false';
  } else {
    // if both or neither are selected, it's the same as not selecting any
    finalizedQuery = undefined;
  }

  let status;
  const hasActive = filters.includes('Active');
  const hasArchived = filters.includes('Archived');

  if (hasActive && !hasArchived) {
    status = 'open';
  } else if (!hasActive && hasArchived) {
    status = 'archived';
  } else {
    // if both or neither are selected, it's the same as not selecting any
    status = undefined;
  }

  const stageMap = {
    Adopted: 'adopted',
    Replaced: 'replaced',
    'Low Adoption': 'low_adoption',
  };

  const stages = Object.entries(stageMap)
    .filter(([filter]) => filters.includes(filter))
    .map(([, value]) => value);

  const stage = stages.length
    ? `${FieldKey.RELEASE_STAGE}:[${stages.join(',')}]`
    : undefined;

  const {data, isError, isPending, getResponseHeader} = useApiQuery<Release[]>(
    [
      `/organizations/${organization.slug}/releases/`,
      {
        query: {
          query: [stage, finalizedQuery].filter(Boolean).join(' '),
          ...locationWithoutWidth.query,
          adoptionStages: 1,
          health: 1,
          per_page: 10,
          status,
        },
      },
    ],
    {staleTime: 0}
  );

  const releaseData =
    isPending || !data
      ? []
      : data.map((release, index, releases) => {
          const projSlug = release.projects[0]?.slug;
          const currentDate = new Date(release.dateCreated);

          const previousDate =
            index < releases.length - 1
              ? new Date(releases[index + 1]?.dateCreated ?? 0)
              : null;

          const lifespan = previousDate
            ? Math.floor(currentDate.getTime() - previousDate.getTime())
            : undefined;

          return {
            project: release.projects[0]!,
            release: release.shortVersion ?? release.version,
            date: release.dateCreated,
            adoption_stage: projSlug
              ? (release.adoptionStages?.[projSlug]?.stage ?? '')
              : '',
            crash_free_sessions: release.projects[0]?.healthData?.crashFreeSessions ?? 0,
            sessions: release.projects[0]?.healthData?.totalSessions ?? 0,
            error_count: release.projects[0]?.newGroups ?? 0,
            project_id: release.projects[0]?.id ?? 0,
            adoption: release.projects[0]?.healthData?.adoption ?? 0,
            lifespan,
          };
        });

  return {
    releaseData,
    isLoading: isPending,
    isError,
    pageLinks: getResponseHeader?.('Link') ?? undefined,
  };
}
