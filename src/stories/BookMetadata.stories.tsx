import type { Meta, StoryObj } from "@storybook/react";
import { BookMetadata } from "@/components/BookMetadata";

const meta = {
  title: "Components/BookMetadata",
  component: BookMetadata,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BookMetadata>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
  },
};

export const Loading: Story = {
  args: {
    title: "Loading Example",
    author: "Test Author",
  },
  parameters: {
    mockData: [
      {
        url: "/api/trpc/books.getMetadata",
        method: "GET",
        status: 200,
        delay: 1000000, // Simulate infinite loading
        response: {},
      },
    ],
  },
};

export const WithError: Story = {
  args: {
    title: "Error Example",
    author: "Test Author",
  },
  parameters: {
    mockData: [
      {
        url: "/api/trpc/books.getMetadata",
        method: "GET",
        status: 500,
        response: {
          error: {
            message: "Failed to fetch book metadata",
          },
        },
      },
    ],
  },
}; 