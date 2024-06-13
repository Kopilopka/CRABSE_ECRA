export function removeElementById({ array, targetId }) {
  console.log('removeElementById', array, targetId)

  return array.reduce((acc, obj) => {
    if (obj.id === targetId) {
      return acc
    } else {
      return [
        ...acc,
        {
          ...obj,
          ...(obj.children && {
            children: removeElementById({
              array: obj.children,
              targetId
            })
          })
        }
      ]
    }
  }, [])
}

export function getElementById({ array, targetId }) {
  return array.reduce((acc, item) => {
    if (acc) {
      return acc
    }

    if (item.id === targetId) {
      acc = item

      return acc
    }

    if (item.children?.length) {
      acc = getElementById({ array: item.children, targetId })
    }

    return acc
  }, null)
}

export function getParentElementById({ array, targetId }) {
  let parent = null

  function findParent({ array, targetId, possibleParent }) {
    array.forEach((item) => {
      if (parent) {
        return
      }

      if (item.id === targetId) {
        parent = possibleParent
        return
      }

      if (item.children?.length) {
        findParent({ array: item.children, targetId, possibleParent: item })
      }
    })
  }

  findParent({ array, targetId })

  return parent
}

export function addNewChildToElementById({ array, targetId, newChild }) {
  return array.reduce((acc, item) => {
    if (item.id === targetId) {
      acc = [
        ...acc,
        {
          ...item,
          children: item.children
            ? [
                ...item.children,
                {
                  ...newChild,
                  key: newChild.id,
                  label:
                    newChild.label + (item.children.length + 1) + (newChild.appendLabelText || '')
                }
              ]
            : [
                {
                  ...newChild,
                  key: newChild.id,
                  label: newChild.label + '1' + (newChild.appendLabelText || '')
                }
              ]
        }
      ]

      return acc
    } else {
      if (item.children) {
        item.children = addNewChildToElementById({
          array: item.children,
          targetId,
          newChild
        })
      }

      acc.push(item)

      return acc
    }
  }, [])
}

export function updatePropForElementById({ array, targetId, propKey, value }) {
  return array.reduce((acc, item) => {
    if (item.id === targetId) {
      item[propKey] = value
    }

    if (item.children?.length) {
      item.children = updatePropForElementById({ array: item.children, targetId, propKey, value })
    }

    acc.push(item)
    return acc
  }, [])
}

export function updateElementById({ array, targetId, newData }) {
  return array.reduce((acc, item) => {
    if (item.id === targetId) {
      item = newData
    }

    if (item.children?.length) {
      item.children = updateElementById({ array: item.children, targetId, newData })
    }

    acc.push(item)
    return acc
  }, [])
}

export function getFormatedDate(timeShift) {
  let today = new Date()

  if (timeShift) {
    today.setDate(today.getDate() - timeShift)
  }

  const yyyy = today.getFullYear()
  let mm = today.getMonth() + 1 // Months start at 0!
  let dd = today.getDate()

  if (dd < 10) dd = '0' + dd
  if (mm < 10) mm = '0' + mm

  return dd + '.' + mm + '.' + yyyy
}
export function getCurrentTime() {
  const currentDate = new Date()

  return currentDate.toTimeString().split(' ')[0]
}

export function getRandomNumber(min, max, round = 0) {
  return (Math.random() * (max - min) + min).toFixed(round)
}

export function convertDigitToLetter(number) {
  let result = ''
  do {
    result = ((number % 26) + 10).toString(36) + result
    number = Math.floor(number / 26) - 1
  } while (number >= 0)
  return result.toUpperCase()
}
