
import { Link } from 'react-router-dom';
import { ExternalLink, Github, Twitter, Facebook, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto bg-black/40 border-t border-white/10 pt-8 pb-6">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-medium text-lg mb-4">Let's Stream V2.0</h3>
            <p className="text-white/70 text-sm">
              Discover and enjoy the best movies and TV shows all in one place.Let's Stream V2.0 helps you find, explore, and watch your favorite content online.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-white/70 hover:text-white transition-colors">
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/tv" className="text-white/70 hover:text-white transition-colors">
                  TV Shows
                </Link>
              </li>
              <li>
                <Link to="/trending" className="text-white/70 hover:text-white transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-white/70 hover:text-white transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-white font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
<Link
  to="/dmca"
  className="text-white/70 hover:text-white transition-colors"
>
  DMCA Notice
</Link>
              </li>
              <li>
<Link
  to="/content-removal"
  className="text-white/70 hover:text-white transition-colors"
>
  Content Removal
</Link>
              </li>
            </ul>
          </div>
          
          {/* Social */}
          <div>
            <h3 className="text-white font-medium mb-4">Connect</h3>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a 
                href="mailto:info@example.com" 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5 text-white" />
              </a>
            </div>
            <p className="mt-4 text-white/50 text-xs">
              Powered by TMDB
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/10 text-center text-white/50 text-xs">
          <p>© {currentYear}Let's Stream V2.0 All rights reserved.</p>
          <p className="mt-1">
            This site does not store any files on its server. All contents are provided by non-affiliated third parties.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
