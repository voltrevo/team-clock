export default function everySecond(callback: () => void): () => void {
  let cancelled = false;

  const run = async () => {
    while (!cancelled) {
      // Ensure we are in the animation frame to proceed
      await nextAnimationFrame();

      const now = new Date();
      const msUntilNextSecond = 1000 - now.getMilliseconds();

      await sleep(msUntilNextSecond);

      if (cancelled) {
        break;
      }

      try {
        callback();
      } catch (error) {
        console.error(error);
      }
    }
  };

  run();

  return () => { cancelled = true; };
}

// Utility to wait for the next animation frame
function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

// Utility to wait for a specified amount of time (ms)
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
