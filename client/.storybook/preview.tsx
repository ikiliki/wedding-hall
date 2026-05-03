import type { Preview } from "@storybook/react";
import type { ComponentProps } from "react";
import { initialize, mswLoader } from "msw-storybook-addon";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import "../src/index.css";
import { defaultHandlers } from "../src/storybook/msw/handlers";
import {
  loggedInSession,
  storybookAuth,
} from "../src/storybook/mocks/supabase-client";

initialize();

type RouterParams = { initialEntries?: string[]; basename?: string };

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const routerCfg =
        (context.parameters as { router?: RouterParams }).router ?? {};
      storybookAuth.setSession(
        context.parameters.auth === "loggedIn" ? loggedInSession : null,
      );

      const entries =
        routerCfg.initialEntries && routerCfg.initialEntries.length > 0
          ? routerCfg.initialEntries
          : ["/"];

      const routerOpts: ComponentProps<typeof MemoryRouter> = {
        initialEntries: entries,
      };
      if (routerCfg.basename && routerCfg.basename.length > 0) {
        routerOpts.basename = routerCfg.basename;
      }

      return (
        <MemoryRouter {...routerOpts}>
          <div
            lang="he"
            dir="rtl"
            style={{
              minHeight: "100vh",
              backgroundColor: "var(--stl-bg-page, #fdfcfb)",
            }}
          >
            <Story />
          </div>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    viewport: {
      disabled: false,
    },
    backgrounds: {
      default: "stitch",
      values: [
        { name: "stitch", value: "#fdfcfb" },
        { name: "ink", value: "#000000" },
      ],
    },
    msw: {
      handlers: defaultHandlers,
    },
  },
  initialGlobals: {
    backgrounds: { value: "stitch" },
  },
};

export default preview;
