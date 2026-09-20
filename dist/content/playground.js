// What the playground starts with.
export const example = `<script>
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
