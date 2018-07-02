var defaultLineWidth = .75;
var defaultShadowSize = 2;

var styles = {
  wireframe: {
    type: 'contour',
    name: 'Wireframe',
    style: {
      land: {
        stroke: {
          strokeStyle: '#666',
          lineWidth: defaultLineWidth,
        },        
        fill: {
          type: 'solid',
          fillStyle: '#fff'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  natural: {
    type: 'contour',
    name: 'Natural',
    style: {
      land: {
        stroke: {
          strokeStyle: '#8C7556',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#486341', '#E5D9C9']
        }
      },
      water: {
        stroke: {
          strokeStyle: '#8C7556',
          lineWidth: defaultLineWidth,
        },        
        fill: {
          type: 'gradient',
          colors: ['#315D9B', '#D5F2FF']
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  solidLight: {
    type: 'contour',
    name: 'Solid Light',
    style: {
      land: {
        stroke: {
          strokeStyle: '#8C7556',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#FFFAE7'
        }
      },
      water: {
        stroke: {
          strokeStyle: '#8C7556',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#D7EFFF'
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  solidDark: {
    type: 'contour',
    name: 'Solid Dark',
    style: {
      land: {
        stroke: {
          strokeStyle: '#fff',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#988D73'
        }
      },
      water: {
        stroke: {
          strokeStyle: '#fff',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#4B82B9'
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  solidGray: {
    type: 'contour',
    name: 'Solid Gray',
    style: {
      land: {
        stroke: {
          strokeStyle: '#999',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#666'
        }
      },
      water: {
        stroke: {
          strokeStyle: '#999',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#fff'
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  tintedGray: {
    type: 'contour',
    name: 'Tinted Gray',
    style: {
      land: {
        stroke: {
          strokeStyle: '#666',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#000', '#fff']
        }
      }
    }
  },

  xRay: {
    type: 'contour',
    name: 'X-Ray',
    style: {
      land: {
        stroke: {
          strokeStyle: '#597171',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#242828', '#DFFFFA']
        }
      }
    }
  },

  nightVision: {
    type: 'contour',
    name: 'Night Vision',
    style: {
      land: {
        stroke: {
          strokeStyle: '#24DD08',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#000000', '#34932D']
        }
      }
    }
  },

  blueprint: {
    type: 'contour',
    name: 'Blueprint',
    style: {
      land: {
        stroke: {
          strokeStyle: '#fff',
          lineWidth: defaultLineWidth,
        },        
        fill: {
          type: 'solid',
          fillStyle: '#2d54af'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  chalkboard: {
    type: 'contour',
    name: 'Chalkboard',
    style: {
      land: {
        stroke: {
          strokeStyle: '#fff9ac',
          lineWidth: defaultLineWidth,
        },        
        fill: {
          type: 'solid',
          fillStyle: '#1a1a1a'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  redlineMarkup: {
    type: 'contour',
    name: 'Redline Markup',
    style: {
      land: {
        stroke: {
          strokeStyle: '#999',
          lineWidth: defaultLineWidth,
        },  
        fill: {
          type: 'none'
        }
      },
      indexLine: {
        stroke: {
          strokeStyle: '#d32a2a'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  grayGhost: {
    type: 'contour',
    name: 'Gray Ghost',
    style: {
      land: {
        stroke: {
          strokeStyle: '#999',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'gradient',
          colors: ['#999', '#000']
        }
      },
      water: {
        stroke: {
          strokeStyle: '#999',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#999'
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  whiteGhost: {
    type: 'contour',
    name: 'White Ghost',
    style: {
      land: {
        stroke: {
          strokeStyle: '#fff',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'gradient',
          colors: ['#fff', '#000']
        }
      },
      water: {
        stroke: {
          strokeStyle: '#fff',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#fff'
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  reverseGhost: {
    type: 'contour',
    name: 'Reverse Ghost',
    style: {
      land: {
        stroke: {
          strokeStyle: '#000',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'gradient',
          colors: ['#000', '#fff']
        }
      },
      water: {
        stroke: {
          strokeStyle: '#000',
          lineWidth: defaultLineWidth
        },
        fill: {
          type: 'solid',
          fillStyle: '#000'
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  spectral: {
    type: 'contour',
    name: 'Spectral',
    style: {
      land: {
        stroke: {
          strokeStyle: '#ccc',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#FDFFD0', '#FF2828']
        }
      },
      water: {
        stroke: {
          strokeStyle: '#ccc',
          lineWidth: defaultLineWidth,
        },        
        fill: {
          type: 'gradient',
          colors: ['#0F63C3', '#FDFFD0']
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  woodgrain: {
    type: 'contour',
    name: 'Woodgrain',
    style: {
      land: {
        stroke: {
          strokeStyle: '#4e3920',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#7c5528', '#ac7e47']
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  oilSlick: {
    type: 'contour',
    name: 'Oil Slick',
    style: {
      land: {
        stroke: {
          strokeStyle: 'rgba(0,0,0,0)',
          lineWidth: defaultLineWidth,
        },
        fill: {
          type: 'gradient',
          colors: ['#DD8C2F', '#D714BD']
        }
      },
      water: {
        stroke: {
          strokeStyle: 'rgba(0,0,0,0)',
          lineWidth: defaultLineWidth,
        },        
        fill: {
          type: 'gradient',
          colors: ['#12B4D5', '#ECEC19']
        }
      }
    },
    options: {
      zeroContour: 0
    }
  },

  sandstone: {
    type: 'contour',
    name: 'Sandstone',
    style: {
      land: {
        stroke: {
          strokeStyle: '#994d14',
          lineWidth: defaultLineWidth,
        },  
        fill: {
          type: 'gradient',
          colors: ['#B15926', '#D7C3AB']
        }
      },
      indexLine: {
        stroke: {
          strokeStyle: '#7a441b'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  highway: {
    type: 'contour',
    name: 'Highway',
    style: {
      land: {
        stroke: {
          strokeStyle: '#ffc132',
          lineWidth: defaultLineWidth,
        },  
        fill: {
          type: 'solid',
          fillStyle: '#323232'
        }
      },
      indexLine: {
        stroke: {
          strokeStyle: '#ffffff'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  legalpad: {
    type: 'contour',
    name: 'Legal Pad',
    style: {
      land: {
        stroke: {
          strokeStyle: '#42a1a8',
          lineWidth: defaultLineWidth,
        },  
        fill: {
          type: 'solid',
          fillStyle: '#ffffaf'
        }
      },
      indexLine: {
        stroke: {
          strokeStyle: '#d36262'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  farmfieldlight: {
    type: 'contour',
    name: 'Farm Field (light)',
    style: {
      land: {
        stroke: {
          strokeStyle: '#6d5130',
          lineWidth: defaultLineWidth,
        },  
        fill: {
          type: 'solid',
          fillStyle: '#80aa37'
        }
      },
      indexLine: {
        stroke: {
          strokeStyle: '#f4db60'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  farmfielddark: {
    type: 'contour',
    name: 'Farm Field (dark)',
    style: {
      land: {
        stroke: {
          strokeStyle: '#56a842',
          lineWidth: defaultLineWidth,
        },  
        fill: {
          type: 'solid',
          fillStyle: '#6d5130'
        }
      },
      indexLine: {
        stroke: {
          strokeStyle: '#b8c443'
        }
      }
    },
    options: {
      indexInterval: 5
    }
  },

  arctic: {
    type: 'illuminated',
    name: 'Arctic',
    style: {
      land: {
        stroke: {
          strokeStyle: '#B1AEA4',
          lineWidth: defaultShadowSize + 1,
          shadowColor: '#5B5143',
          shadowBlur: defaultShadowSize,
          shadowOffsetX: defaultShadowSize,
          shadowOffsetY: defaultShadowSize
        },
        fill: {
          type: 'solid',
          fillStyle: '#fff'
        }
      },
      water: {
        stroke: {
          strokeStyle: 'rgba(224, 242, 255, .5)',
          lineWidth: defaultShadowSize + 1,
          shadowColor: '#4e5c66',
          shadowBlur: defaultShadowSize,
          shadowOffsetX: defaultShadowSize,
          shadowOffsetY: defaultShadowSize
        },
        fill: {
          type: 'solid',
          fillStyle: '#fff'
        }
      }
    }
  },

  sunrise: {
    type: 'illuminated',
    name: 'Sunrise',
    style: {
      land: {
        stroke: {
          strokeStyle: '#E7A146',
          lineWidth: defaultShadowSize + 1,
          shadowColor: '#2C294E',
          shadowBlur: defaultShadowSize,
          shadowOffsetX: defaultShadowSize,
          shadowOffsetY: defaultShadowSize
        },
        fill: {
          type: 'gradient',
          colors: ['#333', '#fff']
        }
      }
    }
  },

  beach: {
    type: 'illuminated',
    name: 'Beach',
    style: {
      land: {
        stroke: {
          strokeStyle: '#BAA480',
          lineWidth: defaultShadowSize + 1,
          shadowColor: '#776952',
          shadowBlur: defaultShadowSize,
          shadowOffsetX: defaultShadowSize,
          shadowOffsetY: defaultShadowSize
        },
        fill: {
          type: 'solid',
          fillStyle: '#FFF4B5'
        }
      },
      water: {
        stroke: {
          strokeStyle: 'rgba(224, 242, 255, .5)',
          lineWidth: defaultShadowSize + 1,
          shadowColor: '#4e5c66',
          shadowBlur: defaultShadowSize,
          shadowOffsetX: defaultShadowSize,
          shadowOffsetY: defaultShadowSize
        },
        fill: {
          type: 'solid',
          fillStyle: '#4C8C9B'
        }
      }
    }
  }
}

var fonts = [
  {
    name: 'Nimbus Sans',
    className: 'tk-nimbus-sans',
    type: 'sans serif'
  },
  {
    name: 'Futura PT',
    className: 'tk-futura-pt',
    type: 'sans serif'
  },
  {
    name: 'Meta',
    className: 'tk-ff-meta-web-pro',
    type: 'sans serif'
  },
  {
    name: 'Aller',
    className: 'tk-aller',
    type: 'sans serif'
  },
  {
    name: 'Eurostile',
    className: 'tk-eurostile',
    type: 'sans serif'
  },
  {
    name: 'Copperplate',
    className: 'tk-copperplate',
    type: 'serif',
    smallcaps: true
  },
  {
    name: 'Trajan',
    className: 'tk-trajan-pro-3',
    type: 'serif',
    smallcaps: true
  },
  {
    name: 'Clarendon URW',
    className: 'tk-clarendon-urw',
    type: 'serif'
  },
  {
    name: 'Bodoni URW',
    className: 'tk-bodoni-urw',
    type: 'serif'
  },
  {
    name: 'Adobe Caslon Pro',
    className: 'tk-adobe-caslon-pro',
    type: 'serif'
  }
]