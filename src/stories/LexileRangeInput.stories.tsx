import type { Meta, StoryObj } from "@storybook/react";
import { LexileRangeInput } from "../components/LexileRangeInput";

const meta = {
  title: "Components/LexileRangeInput",
  component: LexileRangeInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LexileRangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onRangeChange: (min: number, max: number) => {
      console.log(`Range changed: ${min}L - ${max}L`);
    },
  },
};

export const WithError: Story = {
  args: {
    onRangeChange: (min: number, max: number) => {
      console.log(`Range changed: ${min}L - ${max}L`);
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const minInput = canvasElement.querySelector("#min-lexile") as HTMLInputElement;
    const maxInput = canvasElement.querySelector("#max-lexile") as HTMLInputElement;
    
    if (minInput && maxInput) {
      minInput.value = "800";
      maxInput.value = "600";
      minInput.dispatchEvent(new Event("change"));
      maxInput.dispatchEvent(new Event("change"));
    }
  },
}; 