import { Link } from 'react-router-dom';

// Version (from package.json, injected at build time by vite.config.js) and copyright, at the bottom of each page.
export default function AppFooter() {
  return (
    <footer dir="ltr" className="mt-12 pb-2 text-center text-xs text-slate-500 space-y-1">
      <p>
        <Link to="/positions" className="text-slate-400 hover:text-slate-200 underline underline-offset-2">
          شرح المراكز · Positions guide
        </Link>
      </p>
      <p>Version {__APP_VERSION__}</p>
      <p>© {new Date().getFullYear()} Zemer Teams Generator. All rights reserved.</p>
    </footer>
  );
}
