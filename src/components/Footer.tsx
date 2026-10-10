import { SITE, whatsappLink } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="w grid">
        <div>
          <h3>Guangzhou warehouse</h3>
          <p>{SITE.guangzhou}</p>
          <p>{SITE.chinaPhones.join(" / ")}</p>
        </div>
        <div>
          <h3>Lagos office</h3>
          <p>{SITE.lagos}</p>
        </div>
        <div>
          <h3>Contact</h3>
          <p>
            <a href={whatsappLink()} rel="noopener noreferrer" target="_blank">
              WhatsApp
            </a>
          </p>
          {SITE.email && <p>{SITE.email}</p>}
        </div>
      </div>
      <p className="w small foot-note">© {new Date().getFullYear()} {SITE.name}</p>
    </footer>
  );
}
