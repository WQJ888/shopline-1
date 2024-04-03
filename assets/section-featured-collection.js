defineCustomElement(
  'featured-collection-tabs',
  () =>
    class FeaturedCollectionTabs extends HTMLElement {
      constructor() {
        super();

        const tabs = this.querySelector('.featured-collection__tabs');
        const tabList = this.querySelectorAll('.featured-collection__tabs-item');

        function toggle(id, bl) {
          const listDom = document.querySelectorAll(`.slider-block--${id}`);
          listDom.forEach((item) => {
            if (bl) {
              item.classList.remove('display-none');
            } else {
              item.classList.add('display-none');
            }
          });
        }

        tabs.addEventListener('click', (ev) => {
          const dom = ev.target;
          const { id } = dom.dataset;

          if (!id) return;

          tabList.forEach((tab) => {
            const active = tab.dataset.id === id;
            this.toggleTabStatus(tab, active);
            if (active) {
              tabs.scrollTo({ left: tab.offsetLeft - tab.clientWidth, behavior: 'smooth' });
            }
            toggle(tab.dataset.id, tab.dataset.id === id);
          });
        });
      }

      toggleTabStatus(tab, active) {
        if (active) {
          tab.classList.remove('button--secondary');
        } else {
          tab.classList.add('button--secondary');
        }
      }
    },
);

defineCustomElement(
  'featured-collection',
  () =>
    class FeaturedCollection extends HTMLElement {
      constructor() {
        super();

        this.columnsDesktop = Number(this.dataset.columns_desktop);
        this.sliders = [...this.querySelectorAll('slider-component')];

        this.bindSliderButton();
      }

      bindSliderButton() {
        this.querySelector('.featured-collection__controls').addEventListener('click', (e) => {
          const button = e.target.closest('.slider-button');
          if (!button) {
            return;
          }
          const { id, type } = button.dataset;
          const slider = this.sliders.find((item) => item.classList.contains(`slider-block--${id}`));
          const current = slider.currentPage;
          const num = this.columnsDesktop;
          const target = type === 'next' ? current + num : current - num;
          slider.slideTo(target);
        });
      }
    },
);
