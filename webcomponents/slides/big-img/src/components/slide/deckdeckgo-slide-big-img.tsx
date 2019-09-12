import { Component, Element, Event, EventEmitter, Method, Prop, h, Host } from '@stencil/core';

import {
  DeckdeckgoSlide,
  hideLazyLoadImages,
  afterSwipe,
  lazyLoadContent,
  hideAllRevealElements,
  showAllRevealElements
} from '@deckdeckgo/slide-utils';

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

@Component({
  tag: 'deckgo-slide-big-img',
  styleUrl: 'deckdeckgo-slide-big-img.scss',
  shadow: true
})
export class DeckdeckgoSlideBigImg implements DeckdeckgoSlide {
  @Element() el: HTMLElement;

  @Event() slideDidLoad: EventEmitter<void>;

  @Prop({ reflectToAttr: true }) customActions: boolean = false;
  @Prop({ reflectToAttr: true }) customBackground: boolean = false;
  @Prop() imgSrc: string = '';
  @Prop() imgDivisions: string = '';
  @Prop() axis: 'x' | 'y' = 'x';

  private crop: HTMLElement;
  private bigImg: HTMLElement;
  private currentStep: number = -1;

  private get divisions(): number[] {
    return this.imgDivisions.split(';').map(str => {
      const num = parseInt(str);
      if (isNaN(num)) {
        return 0;
      }
      return num;
    });
  }

  async componentDidLoad() {
    await hideLazyLoadImages(this.el);

    this.crop = this.el.shadowRoot.querySelector('.crop');
    this.bigImg = this.el.shadowRoot.querySelector('.big-image');

    this.slideDidLoad.emit();
  }

  private next() {
    this.prevNext(true);
  }

  private prev() {
    this.prevNext(false);
  }

  private prevNext(next: boolean) {
    const axisDimension = this.axis === 'x' ? 'width' : 'height';
    const perpendicularAxisDimension = this.axis === 'y' ? 'width' : 'height';

    if (next && this.currentStep === -1) {
      this.bigImg.style[perpendicularAxisDimension] = '100%';
      this.bigImg.classList.add('cropped');
    }
    if (!next && this.currentStep === 0) {
      this.bigImg.classList.remove('cropped');
      this.bigImg.style[perpendicularAxisDimension] = '';
      this.crop.style.height = '';
      this.crop.style.width = '';
    }

    this.currentStep = this.currentStep + (next ? 1 : -1);

    const previousNaturalDivision = this.currentStep === 0 ? 0 : this.divisions[this.currentStep - 1];

    const imgClientLength = this.bigImg[`client${capitalize(axisDimension)}`];
    const imgNaturalLength = this.bigImg[`natural${capitalize(axisDimension)}`];

    const lengthFactor = imgClientLength / imgNaturalLength;

    const currentNaturalDivision = this.isEnd() ? imgNaturalLength : this.divisions[this.currentStep];

    this.crop.style[axisDimension] = (currentNaturalDivision - previousNaturalDivision) * lengthFactor + 'px';
    this.bigImg.style[`margin${this.axis === 'x' ? 'Left' : 'Top'}`] = -(previousNaturalDivision * lengthFactor) + 'px';
  }

  private isEnd(): boolean {
    return this.currentStep === this.divisions.length;
  }

  private isBeginning(): boolean {
    return this.currentStep === -1;
  }

  @Method()
  beforeSwipe(enter: boolean): Promise<boolean> {
    return new Promise<boolean>(async resolve => {
      const couldSwipe: boolean = !this.divisions[0] || (enter ? this.isEnd() : this.isBeginning());

      if (couldSwipe) {
        resolve(true);
        return;
      }

      if (enter) {
        await this.next();
      } else {
        await this.prev();
      }

      resolve(false);
    });
  }

  @Method()
  afterSwipe(): Promise<void> {
    return afterSwipe();
  }

  @Method()
  lazyLoadContent(): Promise<void> {
    return lazyLoadContent(this.el);
  }

  @Method()
  revealContent(): Promise<void> {
    return showAllRevealElements(this.el);
  }

  @Method()
  hideContent(): Promise<void> {
    return hideAllRevealElements(this.el);
  }

  render() {
    return (
      <Host class={{ 'deckgo-slide-container': true }}>
        <div class="deckgo-slide">
          <div class="crop">
            <img class="big-image" data-src={this.imgSrc} />
          </div>
        </div>
      </Host>
    );
  }
}
