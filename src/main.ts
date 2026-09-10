import './style.css';
import { subscribe } from './game/state';
import { renderApp } from './ui/screens';

const app = document.querySelector<HTMLDivElement>('#app')!;
const paint = renderApp(app);
subscribe(paint);
paint();
