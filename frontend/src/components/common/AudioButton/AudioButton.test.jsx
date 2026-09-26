import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AudioButton from "./AudioButton";

const nativeAudioConstructor = window.Audio;
let audioInstance;
let audioEventHandlers;

beforeEach(() => {
  audioEventHandlers = {};
  audioInstance = {
    paused: true,
    currentTime: 0,
    addEventListener: jest.fn((eventName, callback) => {
      audioEventHandlers[eventName] = callback;
    }),
    removeEventListener: jest.fn(),
    play: jest.fn(() => {
      audioInstance.paused = false;
      audioEventHandlers.play?.();
      return Promise.resolve();
    }),
    pause: jest.fn(() => {
      audioInstance.paused = true;
      audioEventHandlers.pause?.();
    }),
  };

  window.Audio = jest.fn(() => audioInstance);
});

afterEach(() => {
  window.Audio = nativeAudioConstructor;
});

describe("AudioButton", () => {
  test("shows the stop icon while audio is playing, then returns to play on stop", async () => {
    render(<AudioButton src="/audio/word.mp3" label="Nghe từ" />);

    const playButton = screen.getByRole("button", { name: "Nghe từ" });
    expect(playButton).toHaveTextContent("▶");

    fireEvent.click(playButton);

    await waitFor(() => {
      expect(playButton).toHaveAttribute("aria-pressed", "true");
      expect(playButton).toHaveTextContent("■");
    });

    audioInstance.currentTime = 1.5;
    fireEvent.click(screen.getByRole("button", { name: "Dừng nghe từ" }));

    expect(audioInstance.pause).toHaveBeenCalled();
    expect(audioInstance.currentTime).toBe(0);
    expect(playButton).toHaveAttribute("aria-pressed", "false");
    expect(playButton).toHaveTextContent("▶");
  });

  test("returns to the play icon when the audio ends naturally", async () => {
    render(<AudioButton src="/audio/example.mp3" label="Nghe ví dụ" />);

    fireEvent.click(screen.getByRole("button", { name: "Nghe ví dụ" }));
    const stopButton = await screen.findByRole("button", { name: "Dừng nghe ví dụ" });

    act(() => {
      audioEventHandlers.ended();
    });

    expect(stopButton).toHaveAttribute("aria-pressed", "false");
    expect(stopButton).toHaveTextContent("▶");
  });
});
