import type { Meta, StoryObj } from "@storybook/react";
import { ErrorMessage } from "@/components/ErrorMessage";

const meta = {
  title: "Components/ErrorMessage",
  component: ErrorMessage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: "Something went wrong. Please try again.",
  },
};

export const LongMessage: Story = {
  args: {
    message: "We encountered an error while trying to fetch your book recommendations. This could be due to network issues or server problems. Please try again later or contact support if the issue persists.",
  },
}; 