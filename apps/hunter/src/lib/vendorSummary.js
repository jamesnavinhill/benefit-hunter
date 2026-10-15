export function groupProgramsByVendor(programs) {
  const groups = new Map();

  for (const program of programs) {
    if (!groups.has(program.vendor)) {
        groups.set(program.vendor, {
        name: program.vendor,
        programs: [],
        counted: 0,
        cashLike: 0,
        inKind: 0,
        valuedOffers: 0,
      });
    }

    const group = groups.get(program.vendor);
    group.programs.push(program);
    if (program.value?.counted) {
      const estimate = Number(program.value.estimate) || 0;
      group.counted += estimate;
      group.valuedOffers += 1;
      if (program.value.cashLike) group.cashLike += estimate;
      else group.inKind += estimate;
    }
  }

  return [...groups.values()].sort((a, b) =>
    b.counted - a.counted || b.programs.length - a.programs.length || a.name.localeCompare(b.name)
  );
}
