import {Component, State, h, Fragment, Listen, JSX} from '@stencil/core';

import {injectJS} from '@deckdeckgo/editor';

import i18n from '../../../stores/i18n.store';
import navStore, {NavDirection} from '../../../stores/nav.store';
import tokenStore from '../../../stores/token.store';
import errorStore from '../../../stores/error.store';

import {AppIcon} from '../app-icon/app-icon';

import {EnvironmentConfigService} from '../../../services/environment/environment-config.service';
import {EnvironmentCloud, EnvironmentDeckDeckGoConfig} from '../../../types/core/environment-config';

import {renderI18n} from '../../../utils/core/i18n.utils';
import {firebase, cloud} from '../../../utils/core/environment.utils';
import {removeSyncBeforeUnload} from '../../../utils/core/before-unload.utils';

@Component({
  tag: 'app-signin',
  styleUrl: 'app-signin.scss'
})
export class AppSignIn {
  @State()
  private signInInProgress: boolean = false;

  @State()
  private signIn: JSX.IntrinsicElements;

  private deckDeckGoConfig: EnvironmentDeckDeckGoConfig | undefined = EnvironmentConfigService.getInstance().get('deckdeckgo');

  async componentDidLoad() {
    this.signInInProgress = false;

    await this.loadSignIn();

    await this.initSignIn();

    // We do not want to present a warning when user sign in
    removeSyncBeforeUnload();
  }

  private onSignInSuccess = (credentials: {uid: string | undefined; githubAccessToken: string | undefined} | undefined) => {
    this.signInInProgress = true;

    this.saveGithubCredentials(credentials);

    this.navigateRedirect();
  };

  private onSignInError = (err?: string) => {
    console.error(err);

    errorStore.state.error = 'There was an issue sign in with the internet identity.';
  };

  private navigateRedirect() {
    navStore.state.nav = {
      url: '/',
      direction: NavDirection.RELOAD
    };
  }

  private saveGithubCredentials(credentials: {uid: string | undefined; githubAccessToken: string | undefined} | undefined) {
    if (!credentials) {
      return;
    }

    const {uid, githubAccessToken} = credentials;

    if (!uid || !githubAccessToken) {
      return;
    }

    tokenStore.state.token = {
      id: uid,
      data: {
        github: {
          token: githubAccessToken
        }
      }
    };
  }

  private async loadSignIn() {
    if (!cloud()) {
      return;
    }

    const {signIn}: EnvironmentCloud = EnvironmentConfigService.getInstance().get('cloud');

    const {cdn, tag} = signIn;

    await injectJS({
      id: `deckgo-${tag}`,
      src: cdn,
      module: true
    });
  }

  private async initSignIn() {
    if (!cloud()) {
      return;
    }

    const {signIn}: EnvironmentCloud = EnvironmentConfigService.getInstance().get('cloud');

    const {tag} = signIn;

    const Element = `${tag}`;

    this.signIn = (
      <Element
        config={this.deckDeckGoConfig}
        signInSuccess={this.onSignInSuccess}
        signInError={this.onSignInError}
        i18n={i18n.state}></Element>
    );
  }

  async navigateBack() {
    navStore.state.nav = {
      direction: NavDirection.BACK
    };
  }

  @Listen('inProgress')
  onInProgress({detail}: CustomEvent<boolean>) {
    this.signInInProgress = detail;
  }

  render() {
    return [
      <main class="ion-padding fit">
        {this.renderBackButton()}

        {this.renderSignIn()}
      </main>
    ];
  }

  private renderSignIn() {
    return (
      <Fragment>
        {this.renderMsg()}

        {this.renderGitHub()}

        {this.signIn || (
          <div class="spinner">
            <ion-spinner color="medium"></ion-spinner>
          </div>
        )}
      </Fragment>
    );
  }

  private renderBackButton() {
    return (
      <ion-buttons class="back">
        <ion-button onClick={() => this.navigateBack()} color="dark" aria-label={i18n.state.core.close} disabled={this.signInInProgress}>
          <AppIcon name="close" ariaHidden={true} ariaLabel=""></AppIcon>
        </ion-button>
      </ion-buttons>
    );
  }

  private renderMsg() {
    return [
      <h1 class="ion-text-center ion-padding-start ion-padding-end">{i18n.state.sign_in.hi}</h1>,
      <p class="ion-text-center ion-padding">{i18n.state.sign_in.why}</p>
    ];
  }

  private renderGitHub() {
    if (!firebase()) {
      return undefined;
    }

    return (
      <p class="ion-text-center ion-padding-start ion-padding-end ion-padding-bottom">
        {renderI18n(i18n.state.sign_in.additionally, {
          placeholder: '{0}',
          value: <AppIcon name="github" ariaLabel="" ariaHidden={true}></AppIcon>
        })}
      </p>
    );
  }
}
