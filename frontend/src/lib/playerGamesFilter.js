// Filtra as notas de um jogador (GET /ratings/player/:id) conforme a coluna clicada no ranking.
// As regras espelham exatamente as consultas de GET /ratings/stats:
// - games:    toda nota registrada conta como jogo (COUNT(r.id))
// - bruninho: AVG ignora jogos sem nota do Bruninho
// - simoes:   AVG ignora jogos sem nota do Simões
// - best:     MAX(average_rating); em caso de empate, todos os jogos com esse valor
// - craque:   média do jogador = maior média do jogo (empates contam para todos)
// - bagre:    média do jogador = menor média do jogo (empates contam para todos)
// No Ranking Geral o SQL só considera jogos com pelo menos uma média (JOIN com match_best),
// por isso onlyMatchesWithAvg = true quando não há campeonato selecionado.
export function filterGames(rows, column, onlyMatchesWithAvg) {
  // Ranking Geral: o SQL só conta notas de jogos que têm pelo menos uma média (JOIN com match_best).
  const base = onlyMatchesWithAvg ? rows.filter(r => r.match_best_avg !== null) : rows;

  switch (column) {
    case 'games':    return base;
    case 'bruninho': return base.filter(r => r.bruninho_rating !== null);
    case 'simoes':   return base.filter(r => r.simoes_rating !== null);
    case 'craque':   return base.filter(r => r.is_craque);
    case 'bagre':    return base.filter(r => r.is_bagre);
    case 'best': {
      const withAvg = base.filter(r => r.average_rating !== null);
      if (withAvg.length === 0) return [];
      const max = Math.max(...withAvg.map(r => parseFloat(r.average_rating)));
      return withAvg.filter(r => parseFloat(r.average_rating) === max); // empate: mostra todos
    }
    default: return base;
  }
}