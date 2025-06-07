// Import Tone.js
import * as Tone from "tone";

// Create a synth and connect it to the master output
const synth = new Tone.Synth().toDestination();

// Define the notes for "Twinkle, Twinkle Little Star"
// The format is [note, duration]
const melody = [
    ["C4", "4n"],
    ["C4", "4n"],
    ["G4", "4n"],
    ["G4", "4n"],
    ["A4", "4n"],
    ["A4", "4n"],
    ["G4", "2n"],
    ["F4", "4n"],
    ["F4", "4n"],
    ["E4", "4n"],
    ["E4", "4n"],
    ["D4", "4n"],
    ["D4", "4n"],
    ["C4", "2n"],

    ["G4", "4n"],
    ["G4", "4n"],
    ["F4", "4n"],
    ["F4", "4n"],
    ["E4", "4n"],
    ["E4", "4n"],
    ["D4", "2n"],
    ["G4", "4n"],
    ["G4", "4n"],
    ["F4", "4n"],
    ["F4", "4n"],
    ["E4", "4n"],
    ["E4", "4n"],
    ["D4", "2n"],

    ["C4", "4n"],
    ["C4", "4n"],
    ["G4", "4n"],
    ["G4", "4n"],
    ["A4", "4n"],
    ["A4", "4n"],
    ["G4", "2n"],
    ["F4", "4n"],
    ["F4", "4n"],
    ["E4", "4n"],
    ["E4", "4n"],
    ["D4", "4n"],
    ["D4", "4n"],
    ["C4", "2n"],
];

let startTime = 0;

function playMelody() {
    // Make sure the audio context is running
    // Tone.start() returns a Promise, so we can use .then()
    if (Tone.context.state !== "running") {
        Tone.start().then(() => {
            console.log("Audio context started.");
            scheduleNotes();
        });
    } else {
        scheduleNotes();
    }
}

function scheduleNotes() {
    // Reset start time for replay
    startTime = Tone.now(); // Get the current time in the audio context

    Tone.Transport.cancel(0); // Clear any previously scheduled events

    melody.forEach(([note, duration]) => {
        // Schedule each note to play at a specific time
        synth.triggerAttackRelease(note, duration, startTime);

        // Advance the start time for the next note
        startTime += Tone.Time(duration).toSeconds();
    });
}

// Get the button and add an event listener
const playButton = document.getElementById("root");
if (playButton) {
    playButton.addEventListener("click", playMelody);
} else {
    console.error("Play button not found!");
}
