const getMethod = (abi, methodName) => abi.filter(({ name }) => name === methodName)

const fixSigV = (sig) => {
  const { groups: match } = sig.match(
    /^0x(?<r>[a-fA-F0-9]{64})(?<s>[a-fA-F0-9]{64})(?<v>[a-fA-F0-9]{2})$/
  )
  let v = parseInt(match.v, 16)
  v = v < 2 ? v + 0x1f : v
  return `0x${match.r}${match.s}${v.toString(16)}`
}

module.exports = { getMethod, fixSigV }
