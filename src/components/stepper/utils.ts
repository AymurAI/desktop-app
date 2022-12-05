import { Location } from 'react-router-dom';

type RouteObject = {
  [key: string]: number;
};
export const getStep = (location: Location) => {
  // This extracts the current pathname, without the '/'
  const path = location.pathname.split('/')[1];
  const routes: RouteObject = {
    preview: 1,
    process: 2,
    validation: 3,
    finish: 4,
  };

  return routes[path] ?? 0;
};
