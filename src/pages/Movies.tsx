
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MoviesRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/movies', { replace: true });
  }, [navigate]);
  
  return null;
};

export default MoviesRedirect;
