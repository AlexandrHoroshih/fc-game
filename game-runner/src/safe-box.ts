import ivm from 'isolated-vm';

export const createSafeRunner = (code: string) => {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = isolate.createContextSync();

  context.global.setSync('Promise', undefined)
  context.global.setSync('setTimeout', undefined)
  context.global.setSync('setInterval', undefined)
  context.global.setSync('setImmediate', undefined)
  context.global.setSync('require', undefined)
  context.global.setSync('process', undefined)
  context.global.setSync('XMLHttpRequest', undefined)

  const runnerCode = `
   const state = JSON.parse($0);
   const move = (game) => {
    ${code}
   }
   const result = move(state);

   return JSON.stringify(result);
  `
  
  return (gameState) => {
    const nextMove = context.evalClosureSync(runnerCode, [JSON.stringify(gameState)], {timeout: 2500})
    return JSON.parse(nextMove);
  }

}
