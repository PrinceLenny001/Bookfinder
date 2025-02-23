import type { Meta, StoryObj } from "@storybook/react";
import { BookModal } from "@/components/BookModal";

const meta: Meta<typeof BookModal> = {
  title: "Components/BookModal",
  component: BookModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BookModal>;

export const WithDescription: Story = {
  args: {
    book: {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      description: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.",
    },
    onClose: () => {},
  },
};

export const WithoutDescription: Story = {
  args: {
    book: {
      title: "Sample Book",
      author: "Sample Author",
    },
    onClose: () => {},
  },
};

export const Closed: Story = {
  args: {
    book: null,
    onClose: () => {},
  },
}; 