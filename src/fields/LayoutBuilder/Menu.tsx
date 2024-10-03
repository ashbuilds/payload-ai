import React, { useCallback, useState } from 'react'

import { Item } from './Item.js'
import styles from './menu.module.scss'
import { LexicalSchemaMap } from './schema.js'

const Menu = ({ items, onSelect }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null)

  const handleItemClick = useCallback((index) => {
    setActiveSubmenu((prev) => (prev === index ? null : index))
  }, [])

  return items.flatMap((item, index) => {
    if (!LexicalSchemaMap.root.children.includes(item.type)) return []

    if (item.children?.length) {
      return (
        <div className={styles.menu} key={index}>
          <Item onClick={() => handleItemClick(index)}>{item.type}</Item>
          <div className={styles.hoverMenu} data-show={activeSubmenu === index}>
            <div className={`${styles.menu} ${styles.subMenu}`}>
              {item.children.map((c, i) => (
                <Item key={i} onClick={() => onSelect(c, item)}>
                  {c}
                </Item>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <Item key={index} onClick={() => onSelect(item.type)}>
        {item.type}
      </Item>
    )
  })
}

const LexicalSchemaMenu = ({ onSelect }) => {
  const handleSelect = (type, parent) => {
    onSelect(type, parent)
  }

  return (
    <div className={styles.menu}>
      <Menu items={Object.values(LexicalSchemaMap)} onSelect={handleSelect} />
    </div>
  )
}

export { LexicalSchemaMenu }
