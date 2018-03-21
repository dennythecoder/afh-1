import ToolbarButton from '../../src/components/toolbar-button'
import { mount } from '@vue/test-utils'
import { QBtn, QIcon } from 'quasar'

describe('ToolbarButton', () => {
    test('test', () => {
        ToolbarButton.components = {
            QBtn,
            QIcon
        }
        
        const wrapper = mount(ToolbarButton,{
            propsData:{
                name:'Toolbar-Button'
            }
        })
        expect(wrapper.text()).toBe('Toolbar-Button')
    })
})