defineCustomElement(
  'predictive-search',
  () =>
    class PredictiveSearch extends BaseElement {
      constructor() {
        super();

        this.cachedResults = {};
        this.input = this.querySelector('input[type="search"]');
        this.predictiveSearchResults = this.querySelector('[data-predictive-search]');

        this.setupEventListeners();
      }

      get isOpen() {
        return this.getAttribute('open') === 'true';
      }

      get showSuggestedMenu() {
        return this.getAttribute('data-show-suggested-menu') === 'true' && this.query.length === 0;
      }

      get query() {
        return this.input.value.trim();
      }

      get resultsMaxHeight() {
        return window.innerHeight - document.getElementById('shopline-section-header').getBoundingClientRect().bottom;
      }

      get loading() {
        return this.getAttribute('loading') === 'true';
      }

      set loading(isLoading) {
        if (isLoading) {
          this.setAttribute('loading', true);
        } else {
          this.removeAttribute('loading');
        }
      }

      setupEventListeners() {
        const form = this.querySelector('form.search');
        form.addEventListener('submit', this.onFormSubmit.bind(this));

        this.input.addEventListener('input', window.debounce(this.onChange.bind(this), 300));
        this.input.addEventListener('focus', this.onFocus.bind(this));
        this.addEventListener('focusout', this.onFocusOut.bind(this));
        this.addEventListener('keyup', this.onKeyup.bind(this));
        this.addEventListener('keydown', this.onKeydown.bind(this));
      }

      onFormSubmit(event) {
        if (!this.query.length || this.querySelector('[selected="true"]')) event.preventDefault();
      }

      onChange() {
        const searchTerm = this.query;
        // 建议值打开逻辑
        this.hasValue();
        if (this.showSuggestedMenu) {
          this.open();
          return;
        }
        if (!searchTerm.length) return this.close(true);

        this.getSearchResults(searchTerm);
      }

      onFocus() {
        this.setAttribute('data-focus', true);

        const searchTerm = this.query;
        // 建议值打开逻辑
        if (this.showSuggestedMenu) {
          this.hasValue();
          this.open();
          return;
        }
        if (!searchTerm.length) return;

        if (this.getAttribute('results') === 'true') {
          this.open();
        } else {
          this.getSearchResults(searchTerm);
        }
      }

      onFocusOut() {
        setTimeout(() => {
          if (!this.contains(document.activeElement)) {
            this.removeAttribute('data-focus');
            this.close();
          }
        });
      }

      onKeyup(event) {
        if (!this.query.length) this.close(true);
        event.preventDefault();

        switch (event.code) {
          case 'ArrowUp':
            this.switchOption('up');
            break;
          case 'ArrowDown':
            this.switchOption('down');
            break;
          case 'Enter':
            this.selectOption();
            break;
          default:
        }
      }

      onKeydown(event) {
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          event.preventDefault();
        }
      }

      switchOption(direction) {
        if (!this.isOpen) return;

        const moveUp = direction === 'up';
        const selectedElement = this.querySelector('[selected="true"]');
        const allElements = this.querySelectorAll('li');
        let activeElement = this.querySelector('li');

        if (moveUp && !selectedElement) return;

        if (!moveUp && selectedElement) {
          activeElement = selectedElement.nextElementSibling || allElements[0];
        } else if (moveUp) {
          activeElement = selectedElement.previousElementSibling || allElements[allElements.length - 1];
        }

        if (activeElement === selectedElement) return;

        activeElement.setAttribute('selected', true);
        if (selectedElement) selectedElement.setAttribute('selected', false);
      }

      hasValue() {
        if (this.query.length === 0) {
          this.removeAttribute('data-has-value');
        } else {
          this.setAttribute('data-has-value', true);
        }
      }

      selectOption() {
        const selectedProduct = this.querySelector('[selected="true"] a, [selected="true"] button');

        if (selectedProduct) selectedProduct.click();
      }

      getSearchResults(searchTerm) {
        const queryKey = searchTerm.replace(' ', '-').toLowerCase();

        this.loading = true;

        if (this.predictiveSearchResults.querySelectorAll('.predictive-search__item').length === 0) {
          this.predictiveSearchResults.innerHTML = '';
        }

        if (this.cachedResults[queryKey]) {
          return this.renderSearchResult(queryKey, this.cachedResults[queryKey]);
        }

        fetch(
          `${window.routes.predictive_search_url}?q=${encodeURIComponent(
            searchTerm,
          )}&field=title&resource_type=product&limit=5&available_type=show&section_id=predictive-search`,
        )
          .then((response) => {
            if (!response.ok) {
              this.close();
              throw new Error(response.status);
            }
            return response.text();
          })
          .then((text) => {
            const resultHtml = new DOMParser()
              .parseFromString(text, 'text/html')
              .querySelector('.predictive-search-results').innerHTML;
            this.cachedResults[queryKey] = resultHtml;
            this.renderSearchResult(queryKey, resultHtml);
          })
          .catch((error) => {
            this.close();
            throw error;
          });
      }

      renderSearchResult(queryKey, resultHtml) {
        this.loading = false;
        this.predictiveSearchResults.innerHTML = resultHtml.replace('__QUERY_KEY__', queryKey);
        this.setAttribute('results', true);
        if (this.contains(document.activeElement)) this.open();
      }

      open() {
        this.setAttribute('open', true);
        this.predictiveSearchResults.style.maxHeight = `${this.resultsMaxHeight}px`;
      }

      close(clearSearchTerm = false) {
        if (clearSearchTerm) {
          this.input.value = '';
          this.removeAttribute('result');
          this.predictiveSearchResults.innerHTML = '';
        }

        const selectedTarget = this.querySelector('[selected="true"]');

        if (selectedTarget) selectedTarget.setAttribute('selected', false);

        this.removeAttribute('open');
        this.predictiveSearchResults.removeAttribute('style');
      }
    },
);
