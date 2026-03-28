import { Node, Component } from "cc";
import { AnimationController } from '../Components/AnimationController';
import { SpineController } from "../Components/SpineController";
import { MultiSpineController } from "../ReferencePathForAnimationSysV3";
import { CustomAnimationController } from '../Components/CustomAnimationController';
import { IAnimationControl } from "../Definitions/IAnimationControl";
import { IBasicPoolObject } from "../../ObjectPoolManager/Definitions/IBasicPoolObject";
import { BasicPoolObject } from "../../ObjectPoolManager/Components/BasicPoolObject";
import { FindComponent } from '../../FindComponent';
import { MultiAniController } from "../Components/MultiAniController";

//export type AnimationComponentType = IAnimationControl & Component;
export type Ctor<T extends Component = Component> = new (...args: any[]) => T;
export class AniSysTools {

    //--直接取回class的方式去找--
    public static getTargetNodeComponent(targetNode: Node): new (...args: any[]) => Component | null {
        /** 依類別參考搜尋，回傳「建構子本身」，優先 MultiSpineController */
        const componentConstructors: Ctor<Component>[] = [
            MultiSpineController,//--第一優先(因為它裡面包含多個spineController)
            MultiAniController,
            AnimationController,
            SpineController,
            CustomAnimationController,
            BasicPoolObject
        ];

        //--直接去挖建構式的方式去找--
        for (const ctor of componentConstructors) {
            if (FindComponent.findComponentInChildren(targetNode, ctor)) {
                return ctor;
            }
        }

        console.warn('No animation component found on targetNode:', targetNode.name);
        return null;
    }

    //--一次撈全部的component
    public static findComponentsInNode(targetNode: Node): Component[] {

        const componentConstructors: Ctor<Component>[] = [
            MultiSpineController,//--第一優先(因為它裡面包含多個spineController)不須要拿這個
            MultiAniController,
            AnimationController,
            SpineController,
            CustomAnimationController,
            BasicPoolObject
        ];

        const components: Component[] = [];
        for (const ctor of componentConstructors) {
            const component = FindComponent.findComponentInChildren(targetNode, ctor);
            if (component) {
                components.push(component);
            }
        }
        return components;
    }

    //--透過class直接挖出component--
    public static findAndGetIAniComponent(targetNode: Node): Component | null {

        const componentConstructors: Ctor<Component>[] = [
            MultiSpineController,//--第一優先(因為它裡面包含多個spineController)
            MultiAniController,
            AnimationController,
            SpineController,
            CustomAnimationController,
            BasicPoolObject
        ];

        for (const ctor of componentConstructors) {
            const component = FindComponent.findComponentInChildren(targetNode, ctor)
            if (component) {
                return component;
            }
        }

        console.warn('No animation component found on targetNode:', targetNode.name);
        return null;

    }

    public static isIBasicPoolObject(component: any): component is IBasicPoolObject {
        return (
            typeof component === 'object' &&
            component !== null &&
            typeof component.beforeDestroy === 'function' &&
            typeof component.resetData === 'function'
        );
    }

    //確保 Component 實作 IBasicPoolObject
    public static isIBasicPoolObjectComponent(component: Component): component is Component & IBasicPoolObject {
        return AniSysTools.isIBasicPoolObject(component);
    }

    //--直接找實作BasicPoolObject的component
    public static getIBasicPoolObjectComponentConstructor(targetNode: Node): (new (...args: any[]) => Component) | null {
        return FindComponent.findComponentConstructorByCheckFunction(targetNode, AniSysTools.isIBasicPoolObjectComponent);
    }

}