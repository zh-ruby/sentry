from __future__ import annotations

from collections.abc import Mapping, MutableMapping, Sequence
from typing import Any

from sentry.exceptions import PluginError
from sentry.integrations.base import FeatureDescription, IntegrationFeatures
from sentry.interfaces.contexts import ContextType
from sentry.models.project import Project
from sentry.plugins.base.v2 import EventPreprocessor, Plugin2
from sentry.utils.settings import is_self_hosted
from sentry_plugins.base import CorePluginMixin
from sentry_plugins.utils import get_secret_field_config

from .client import InvalidApiUrlError, InvalidWebsiteIdError, SessionStackClient, UnauthorizedError

UNAUTHORIZED_ERROR = (
    "Unauthorized: either the combination of your account email and "
    "access token is invalid or you do not have access"
)

INVALID_API_URL_ERROR = "The provided API URL is invalid"

INVALID_WEBSITE_ID_ERROR = "The provided website ID is invalid"

UNEXPECTED_ERROR = "Unexpected error occurred. Please try again."


class SessionStackPlugin(CorePluginMixin, Plugin2):
    description = "Watch SessionStack recordings in Sentry."
    title = "SessionStack"
    slug = "sessionstack"
    conf_title = title
    conf_key = slug
    required_field = "account_email"

    feature_descriptions = [
        FeatureDescription(
            """
            Watch the SessionStack session replay of a user in a video widget embedded in the Sentry UI for an issue.
            """,
            IntegrationFeatures.SESSION_REPLAY,
        )
    ]

    def has_project_conf(self):
        return True

    def get_custom_contexts(self):
        return [SessionStackContextType]

    def reset_options(self, project=None):
        self.disable(project)

        self.set_option("account_email", "", project)
        self.set_option("api_token", "", project)
        self.set_option("website_id", "", project)
        self.set_option("player_url", "", project)
        self.set_option("api_url", "", project)

    def is_testable(self, **kwargs):
        return False

    def validate_config(self, project, config, actor=None):
        sessionstack_client = SessionStackClient(
            account_email=config.get("account_email"),
            api_token=config.get("api_token"),
            website_id=config.get("website_id"),
            api_url=config.get("api_url"),
            player_url=config.get("player_url"),
        )

        try:
            sessionstack_client.validate_api_access()
        except UnauthorizedError:
            raise PluginError(UNAUTHORIZED_ERROR)
        except InvalidApiUrlError:
            raise PluginError(INVALID_API_URL_ERROR)
        except InvalidWebsiteIdError:
            raise PluginError(INVALID_WEBSITE_ID_ERROR)
        except Exception:
            raise PluginError(UNEXPECTED_ERROR)

        return config

    def get_config(self, project, user=None, initial=None, add_additional_fields: bool = False):
        account_email = self.get_option("account_email", project)
        website_id = self.get_option("website_id", project)
        api_url = self.get_option("api_url", project)
        player_url = self.get_option("player_url", project)

        configurations = [
            {
                "name": "account_email",
                "label": "Account Email",
                "default": account_email,
                "type": "text",
                "placeholder": 'e.g. "user@example.com"',
                "required": True,
            },
            get_secret_field_config(
                name="api_token",
                label="API Token",
                secret=self.get_option("api_token", project),
                help="SessionStack generated API token.",
                required=True,
            ),
            {
                "name": "website_id",
                "label": "Website ID",
                "default": website_id,
                "type": "number",
                "help": "ID of the corresponding website in SessionStack.",
                "required": True,
            },
        ]

        if is_self_hosted():
            # We only support connecting to an on-premises SessionStack from a
            # self-hosted Sentry: https://docs.sessionstack.com/docs/sentry.
            configurations.extend(
                [
                    {
                        "name": "api_url",
                        "label": "SessionStack API URL",
                        "default": api_url,
                        "type": "text",
                        "help": "URL to SessionStack's REST API. The default "
                        'value is "https://api.sessionstack.com/"',
                        "required": False,
                    },
                    {
                        "name": "player_url",
                        "label": "SessionStack Player URL",
                        "default": player_url,
                        "type": "text",
                        "help": "URL to SessionStack's session player. The default "
                        'value is "http://app.sessionstack.com/player/"',
                        "required": False,
                    },
                ]
            )

        return configurations

    def get_event_preprocessors(self, data: Mapping[str, Any]) -> Sequence[EventPreprocessor]:
        context = SessionStackContextType.primary_value_for_data(data)
        if not context:
            return []

        session_id = context.get("session_id")
        if not session_id:
            return []

        project = Project.objects.get_from_cache(id=data.get("project"))
        if not self.is_enabled(project):
            return []

        def preprocess_event(data: MutableMapping[str, Any]) -> MutableMapping[str, Any] | None:
            sessionstack_client = SessionStackClient(
                account_email=self.get_option("account_email", project),
                api_token=self.get_option("api_token", project),
                website_id=self.get_option("website_id", project),
                api_url=self.get_option("api_url", project),
                player_url=self.get_option("player_url", project),
            )

            session_url = sessionstack_client.get_session_url(
                session_id=session_id, event_timestamp=context.get("timestamp")
            )

            context["session_url"] = session_url

            contexts = data.get("contexts") or {}
            contexts["sessionstack"] = context
            data["contexts"] = contexts

            return data

        return [preprocess_event]


class SessionStackContextType(ContextType):
    type = "sessionstack"
