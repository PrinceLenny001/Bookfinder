import type { Meta, StoryObj } from "@storybook/react";
import { GenreSearch } from "@/components/GenreSearch";
import { useState } from "react";

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Adventure",
  "Realistic Fiction",
  "Historical Fiction",
  "Graphic Novels",
  "Horror",
  "Poetry",
  "Biography",
  "Sports",
  "Humor",
] as const;

type Genre = (typeof GENRES)[number];

const meta = {
  title: "Components/GenreSearch",
  component: GenreSearch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GenreSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story with state management
function GenreSearchWithState() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  return (
    <div className="w-[800px] p-4">
      <GenreSearch
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <GenreSearchWithState />,
  args: {
    selectedGenre: null,
    onGenreSelect: () => {},
  },
};

export const WithSelectedGenre: Story = {
  args: {
    selectedGenre: "Fantasy" as Genre,
    onGenreSelect: () => {},
  },
}; 