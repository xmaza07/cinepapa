import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import ErrorPage from '@/pages/ErrorPage';
import TVShowsRedirect from '@/pages/TVShows';
import TVShowDetail from '@/pages/TVShowDetail';
import Movies from '@/pages/Movies';
import MoviesPage from '@/pages/movies';
import SearchPage from '@/pages/SearchPage'; // Import SearchPage
import Watch from '@/pages/Watch';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/tv',
    element: <App />,
  },
  {
    path: '/tv/:tvId',
    element: <TVShowDetail />,
  },
  {
    path: '/watch/:mediaType/:id',
    element: <Watch />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/movies',
    element: <MoviesPage />,
  },
  {
    path: '/Movies',
    element: <Movies />,
  },
  {
    path: '/TVShows',
    element: <TVShowsRedirect />,
  },
]);

export default router;
