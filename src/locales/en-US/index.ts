import { actions } from './actions';
import { auth } from './auth';
import { errors } from './errors';
import { fields } from './fields';
import { pages } from './pages';

export const enUS = {
  ...actions,
  ...auth,
  ...errors,
  ...fields,
  ...pages,
};
