// What the playground starts with, and the examples it offers.
const todo = `<script>
  const n = signal(0);
  const todos = signal(["read the docs", "write a component"]);
  const draft = signal("");

  const add = () => {
    const text = draft().trim();
    if (!text) return;
    todos.set([...todos(), text]);
    draft.set("");
  };
</script>

<section class="box">
  <button on:click={() => n.set(n() + 1)}>clicked {n()} {n() === 1 ? "time" : "times"}</button>

  <form on:submit={(e) => { e.preventDefault(); add(); }}>
    <input bind:value={draft} placeholder="new task">
    <button>add</button>
  </form>

  <ul>
    {#each todos() as t}
      <li>{t}</li>
    {/each}
  </ul>
</section>

<style>
  :scope { display: grid; gap: .8rem; }
  button { cursor: pointer; padding: .3rem .8rem; }
  ul { margin: 0; padding-left: 1.2rem; }
</style>
`;

const counter = `<script>
  const n = signal(0);
  const double = computed(() => n() * 2);
</script>

<div class="box">
  <p>n is {n()}, double is {double()}</p>
  <button on:click={() => n.set(n() + 1)}>+1</button>
  <button on:click={() => n.set(0)} disabled={n() === 0}>reset</button>
</div>

<style>
  :scope { display: grid; gap: .6rem; justify-items: start; }
  p { margin: 0; }
  button { cursor: pointer; padding: .3rem .8rem; }
</style>
`;

const form = `<script>
  const name = signal("");
  const color = signal("orange");
  const loud = signal(false);
  const greeting = computed(() => {
    const text = "hello " + (name() || "you") + ", " + color() + " is a nice color";
    return loud() ? text.toUpperCase() : text;
  });
</script>

<form on:submit={(e) => e.preventDefault()}>
  <input bind:value={name} placeholder="your name">
  <select bind:value={color}>
    <option>orange</option>
    <option>green</option>
    <option>blue</option>
  </select>
  <label><input type="checkbox" bind:checked={loud}> loud</label>
  <p class="out" style={{ color: color() }}>{greeting()}</p>
</form>

<style>
  :scope { display: grid; gap: .7rem; justify-items: start; }
  input, select { padding: .3rem .5rem; }
  .out { margin: 0; font-weight: 700; }
</style>
`;

const tabs = `<script>
  const open = signal("one");
  const pages = { one: "The first page.", two: "The second page.", three: "The third page." };
</script>

<div class="tabs">
  <nav>
    {#each Object.keys(pages) as name (name)}
      <button class={open() === name ? "on" : ""} on:click={() => open.set(name)}>{name}</button>
    {/each}
  </nav>

  {#if open() === "one"}
    <p>{pages.one} It has a bit more text than the others.</p>
  {:else if open() === "two"}
    <p>{pages.two}</p>
  {:else}
    <p>{pages.three}</p>
  {/if}
</div>

<style>
  nav { display: flex; gap: .4rem; margin-bottom: .8rem; }
  button { cursor: pointer; padding: .3rem .8rem; }
  button.on { background: #ff4b1f; color: #000; }
</style>
`;

export const examples = [
  { name: "todo list", code: todo },
  { name: "counter", code: counter },
  { name: "form with bind:", code: form },
  { name: "tabs", code: tabs },
];
export const example = todo;
