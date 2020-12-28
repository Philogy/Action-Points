const getMethod = (abi, methodName) => abi.filter(({ name }) => name === methodName)

module.exports = { getMethod }
