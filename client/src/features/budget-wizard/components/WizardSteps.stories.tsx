import type { Meta, StoryObj } from "@storybook/react";
import { WizardStoryRoutes } from "@/storybook/WizardStoryRoutes";

function step(path: string) {
  return {
    parameters: {
      layout: "fullscreen",
      auth: "loggedIn" as const,
      router: { initialEntries: [path] },
    },
    render: () => <WizardStoryRoutes />,
  };
}

const meta = {
  title: "Features/Wizard/Steps",
} satisfies Meta;

export default meta;

export const Couple: StoryObj = {
  name: "זוגות — שמות",
  ...step("/start/couple"),
};

export const Date: StoryObj = {
  name: "תאריך ולוח שנה",
  ...step("/start/date"),
};

export const Guests: StoryObj = {
  name: "אורחים",
  ...step("/start/guests"),
};

export const TypePicker: StoryObj = {
  name: "סוג אירוע",
  ...step("/start/type"),
};

export const VenuePricing: StoryObj = {
  name: "מחיר אולם",
  ...step("/start/venue"),
};

export const VenuePricingMobile: StoryObj = {
  name: "מחיר אולם — נייד",
  parameters: {
    layout: "fullscreen",
    auth: "loggedIn" as const,
    router: { initialEntries: ["/start/venue"] },
    viewport: {
      defaultViewport: "mobile2",
    },
  },
  render: () => <WizardStoryRoutes />,
};

export const ContinueGate: StoryObj = {
  name: "שער המשך",
  ...step("/start/continue-gate"),
};

export const Completion: StoryObj = {
  name: "סיום",
  ...step("/start/completion"),
};

export const HydrateStart: StoryObj = {
  name: "טעינת אינדקס (/start)",
  ...step("/start"),
};
