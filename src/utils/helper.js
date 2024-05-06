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

// const data = [
//   {
//     id: '0',
//     children: [
//       {
//         id: '0.0',
//         children: [
//           {
//             id: '0.0.0',
//             children: [
//               {
//                 id: '0.0.0.0',
//                 children: [
//                   { id: '0.0.0.0.0', name: 'TEST' },
//                   { id: '0.0.0.0.1', name: 'children' }
//                 ]
//               },
//               { id: '0.0.0.1' }
//             ]
//           },
//           { id: '0.0.1' },
//           { id: '0.0.2' }
//         ]
//       },
//       { id: '0.1' }
//     ]
//   },
//   { id: '1' }
// ]
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
