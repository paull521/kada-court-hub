import { ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
export default function More() {
  return (
    <AppShell active="more">
      <p className="eyebrow">ACCOUNT</p>
      <h1 className="title">More</h1>
      <section className="card section menu">
        <a href="#">
          Profile{" "}
          <span aria-hidden="true">
            <ChevronRight className="go-caret" />
          </span>
        </a>
        <a href="#">
          Payments{" "}
          <span aria-hidden="true">
            <ChevronRight className="go-caret" />
          </span>
        </a>
        <a href="#">
          Conference{" "}
          <span aria-hidden="true">
            <ChevronRight className="go-caret" />
          </span>
        </a>
        <a href="#">
          Settings{" "}
          <span aria-hidden="true">
            <ChevronRight className="go-caret" />
          </span>
        </a>
      </section>
    </AppShell>
  );
}
