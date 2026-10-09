import { SITE, whatsappLink } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="w grid">
        <div>
          <h3>Guangzhou warehouse</h3>
          <p className="mut">{SITE.guangzhou}</p>
        </div>
        <div>
          <h3>Lagos office</h3>
          <p className="mut">{SITE.lagos}</p>
        </div>
        <div>
          <h3>Contact</h3>
          <p>
            <a href={whatsappLink()} rel="noopener noreferrer" target="_blank">
              WhatsApp
            </a>
          </p>
          {SITE.email && <p className="mut">{SITE.email}</p>}
        </div>
      </div>
      <p className="w mut small">© {new Date().getFullYear()} {SITE.name}</p>
    </footer>
  );
}
