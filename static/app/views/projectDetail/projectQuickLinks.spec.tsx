import {ProjectFixture} from 'sentry-fixture/project';

import {initializeOrg} from 'sentry-test/initializeOrg';
import {render, screen, userEvent} from 'sentry-test/reactTestingLibrary';

import ProjectQuickLinks from 'sentry/views/projectDetail/projectQuickLinks';

describe('ProjectDetail > ProjectQuickLinks', function () {
  const {organization, router} = initializeOrg({
    organization: {features: ['performance-view']},
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a list', async function () {
    render(
      <ProjectQuickLinks
        organization={organization}
        location={router.location}
        project={ProjectFixture()}
      />,
      {router}
    );

    expect(screen.getByRole('heading', {name: 'Quick Links'})).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);

    const userFeedback = screen.getByRole('link', {name: 'User Feedback'});
    const keyTransactions = screen.getByRole('link', {name: 'View Transactions'});
    const mostChangedTransactions = screen.getByRole('link', {
      name: 'Most Improved/Regressed Transactions',
    });

    await userEvent.click(userFeedback);
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/organizations/org-slug/user-feedback/',
      query: {project: '2'},
    });

    await userEvent.click(keyTransactions);
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/organizations/org-slug/insights/backend/',
      query: {project: '2'},
    });

    await userEvent.click(mostChangedTransactions);
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/organizations/org-slug/insights/backend/trends/',
      query: {
        cursor: undefined,
        project: '2',
        query: 'tpm():>0.01 transaction.duration:>0 transaction.duration:<15min',
      },
    });
  });

  it('disables link if feature is missing', async function () {
    render(
      <ProjectQuickLinks
        organization={{...organization, features: []}}
        location={router.location}
        project={ProjectFixture()}
      />,
      {router}
    );

    const keyTransactions = screen.getByText('View Transactions');

    await userEvent.click(keyTransactions);
    expect(router.push).toHaveBeenCalledTimes(0);

    await userEvent.hover(keyTransactions);
    expect(
      await screen.findByText("You don't have access to this feature")
    ).toBeInTheDocument();
  });
});
