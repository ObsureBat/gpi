import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="page-width page-section not-found">
      <h1>Page not found</h1>
      <Link to="/">Back to home</Link>
    </div>
  );
}
