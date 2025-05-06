export const defaultStyle = {
  control: {
    fontSize: 12,
    fontWeight: 'normal',
  },

  '&multiLine': {
    control: {
      fontFamily: 'monospace',
      minHeight: 63,
    },
    highlighter: {
      border: '1px solid transparent',
      padding: 9,
    },
    input: {
      padding: 9,
    },
  },

  '&singleLine': {
    display: 'inline-block',
    width: 180,

    highlighter: {
      border: '2px inset transparent',
      padding: 1,
    },
    input: {
      border: '2px inset',
      padding: 1,
    },
  },

  suggestions: {
    item: {
      '&focused': {
        backgroundColor: 'var(--theme-elevation-100)',
      },
      borderBottom: '1px solid rgba(0,0,0,0.15)',
      padding: '5px 15px',
    },
    list: {
      backgroundColor: 'var(--theme-input-bg)',
      borderRadius: '4px',
      bottom: 14,
      fontSize: 14,
      maxHeight: 160,
      overflow: 'auto',
      position: 'absolute',
    },
  },
}
