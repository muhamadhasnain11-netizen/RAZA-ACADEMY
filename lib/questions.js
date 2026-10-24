// Sample bank of original practice questions (not official DVSA ones).
// Phase 2 moves these into Supabase so the admin panel can edit them.
// The engine works with any number of questions; the real test is 50 in 57 minutes, pass mark 43.
export const SECONDS_PER_Q = (57 * 60) / 50;
export const PASS_NUM = 43;
export const PASS_DEN = 50;

export const QUESTIONS = [
  { q: "What is the typical overall stopping distance at 30 mph?", o: ["12 metres (40 feet)", "23 metres (75 feet)", "36 metres (118 feet)", "53 metres (175 feet)"], a: 1, e: "Thinking distance is 9 m and braking distance is 14 m, so about 23 m in total." },
  { q: "What is the national speed limit for cars on a single carriageway road?", o: ["50 mph", "70 mph", "60 mph", "40 mph"], a: 2, e: "Cars and motorcycles can do up to 60 mph on single carriageways unless a sign says otherwise." },
  { q: "You see zig-zag white lines before a pedestrian crossing. What must you not do?", o: ["Slow down", "Park or overtake", "Use your horn", "Change gear"], a: 1, e: "Zig-zag lines keep the crossing clear and visible. No parking, and no overtaking the moving vehicle nearest the crossing." },
  { q: "What is the legal minimum tyre tread depth for a car?", o: ["1.6 mm", "2.5 mm", "0.6 mm", "3.0 mm"], a: 0, e: "The tread must be at least 1.6 mm across the central three-quarters of the tyre, around its whole circumference." },
  { q: "What is the speed limit for cars on a dual carriageway?", o: ["60 mph", "50 mph", "80 mph", "70 mph"], a: 3, e: "The national limit on dual carriageways and motorways is 70 mph for cars, unless signs show a lower limit." },
  { q: "In good, dry conditions, what is the minimum time gap to keep from the vehicle in front?", o: ["1 second", "2 seconds", "5 seconds", "10 seconds"], a: 1, e: "Keep at least a two-second gap. Double it on wet roads and increase it much more on ice." },
  { q: "A pelican crossing has a flashing amber light. What should you do?", o: ["Stop and wait for green", "Sound your horn", "Give way to pedestrians already on the crossing", "Speed up to clear it"], a: 2, e: "Flashing amber means you must give way to anyone on the crossing, but you can go if it is clear." },
  { q: "On a motorway, a red cross is shown above your lane. What does it mean?", o: ["Speed limit applies", "Hard shoulder is open", "No lorries allowed", "Do not use that lane"], a: 3, e: "A red cross means the lane is closed. Do not drive in it. Move to another lane safely when you can." },
];
