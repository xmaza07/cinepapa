
import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import ErrorPage from '@/pages/NotFound';
import Index from '@/pages/Index';
import TVShowsPage from '@/pages/tv';
import TVShowDetail from '@/pages/TVDetails';
import Movies from '@/pages/Movies';
import MoviesPage from '@/pages/movies';
import SearchPage from '@/pages/Search';
import Watch from '@/pages/Player';
import TVShowsRedirect from '@/pages/TVShows';

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: '/tv',
        element: <TVShowsPage />,
      },
      {
        path: '/tv/:tvId',
        element: <TVShowDetail />,
      },
      {
        path: '/watch/:type/:id/:season?/:episode?',
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
    ],
  },
]);

export default router;
