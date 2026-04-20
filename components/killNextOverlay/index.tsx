"use client";

import { useEffect } from "react";

export default function KillNextOverlay() {
  useEffect(() => {
    const kill = () => {
      document
        .querySelectorAll(
          "nextjs-portal,#__next-build-watcher,[data-nextjs-toast]"
        )
        .forEach(el => el.remove());
    };

    kill();

    const observer = new MutationObserver(kill);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
