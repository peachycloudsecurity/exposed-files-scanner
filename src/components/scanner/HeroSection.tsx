import { Shield, Lock, Download, Github, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-6 shadow-lg shadow-primary/20">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-4">
          Exposed Files Scanner
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Scan domains and IPs for exposed Git repos, .env files, configs, SSH keys, cloud credentials, and API endpoints
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Shield className="h-4 w-4 text-foreground" />
            </div>
            <span>Run all analysis from the browser</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="h-4 w-4 text-foreground" />
            </div>
            <span>No data uploaded on the server</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Download className="h-4 w-4 text-foreground" />
            </div>
            <span>Download detected files directly</span>
          </div>

          <a
            href="https://github.com/peachycloudsecurity/exposed-files-scanner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
