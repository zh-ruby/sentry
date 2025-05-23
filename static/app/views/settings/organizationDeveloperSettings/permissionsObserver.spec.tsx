import {render} from 'sentry-test/reactTestingLibrary';

import Form from 'sentry/components/forms/form';
import FormModel from 'sentry/components/forms/model';
import PermissionsObserver from 'sentry/views/settings/organizationDeveloperSettings/permissionsObserver';

describe('PermissionsObserver', () => {
  let model: FormModel;

  function renderForm() {
    model = new FormModel();

    render(
      <Form model={model}>
        <PermissionsObserver
          scopes={['project:read', 'project:write', 'project:releases', 'org:admin']}
          events={['issue']}
          newApp={false}
        />
      </Form>
    );
  }

  it('defaults to no-access for all resources not passed', () => {
    renderForm();
    expect(model.getValue('Team--permission')).toBe('no-access');
    expect(model.getValue('Event--permission')).toBe('no-access');
    expect(model.getValue('Member--permission')).toBe('no-access');
  });

  it('converts a raw list of scopes into permissions', () => {
    renderForm();
    expect(model.getValue('Project--permission')).toBe('write');
    expect(model.getValue('Release--permission')).toBe('admin');
    expect(model.getValue('Organization--permission')).toBe('admin');
  });

  it('selects the highest ranking scope to convert to permission', () => {
    renderForm();
    expect(model.getValue('Project--permission')).toBe('write');
  });
});
