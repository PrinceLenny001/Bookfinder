import type { Meta, StoryObj } from "@storybook/react";
import { BookCover } from "@/components/BookCover";

const meta: Meta<typeof BookCover> = {
  component: BookCover,
  title: "Components/BookCover",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof BookCover>;

export const Default: Story = {
  args: {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    className: "w-48 h-64",
  },
};

export const WithCoverOptions: Story = {
  args: {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    className: "w-48 h-64",
    coverOptions: [
      {
        description: "A green hill with a round door, surrounded by a garden",
        style: "watercolor"
      },
      {
        description: "A dragon sleeping on a pile of gold",
        style: "digital art"
      }
    ],
    selectedCoverIndex: 0,
  },
};

export const LongTitle: Story = {
  args: {
    title: "The Fellowship of the Ring: Being the First Part of The Lord of the Rings",
    author: "J.R.R. Tolkien",
    className: "w-48 h-64",
  },
};

export const LongAuthor: Story = {
  args: {
    title: "The Hobbit",
    author: "John Ronald Reuel Tolkien, CBE, FRSL, Professor of Anglo-Saxon at Oxford University",
    className: "w-48 h-64",
  },
}; 