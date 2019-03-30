var App = (function () {
	'use strict';

	function noop() {}

	function run(fn) {
		return fn();
	}

	function blankObject() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detachNode(node) {
		node.parentNode.removeChild(node);
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detach);
		}
	}

	function createElement(name) {
		return document.createElement(name);
	}

	function createText(data) {
		return document.createTextNode(data);
	}

	function addListener(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function children (element) {
		return Array.from(element.childNodes);
	}

	function setData(text, data) {
		text.data = '' + data;
	}

	function setStyle(node, key, value) {
		node.style.setProperty(key, value);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function beforeUpdate(fn) {
		get_current_component().$$.before_render.push(fn);
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	let dirty_components = [];

	let update_promise;
	const binding_callbacks = [];
	const render_callbacks = [];

	function schedule_update() {
		if (!update_promise) {
			update_promise = Promise.resolve();
			update_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		update_promise = null;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case — component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detach) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detach);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = {};
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			update: noop,
			not_equal: not_equal$$1,
			bound: blankObject(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blankObject(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.bound[key]) $$.bound[key](value);

				if ($$.ctx) {
					const changed = not_equal$$1(value, $$.ctx[key]);
					if (ready && changed) {
						make_dirty(component, key);
					}

					$$.ctx[key] = value;
					return changed;
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	/* src/Smilometer.html generated by Svelte v3.0.0-beta.3 */

	function create_fragment(ctx) {
		var div1, div0, span, text_value = ctx.currEmoji.icon, text;

		return {
			c() {
				div1 = createElement("div");
				div0 = createElement("div");
				span = createElement("span");
				text = createText(text_value);
				span.className = "svelte-14ssj7m";
				div0.className = "emoji svelte-14ssj7m";
				setStyle(div0, "border", "0.5rem solid " + ctx.currEmoji.color);
				setStyle(div0, "--sentiment", ctx.sentiment);
				div1.className = "meter svelte-14ssj7m";
			},

			m(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, span);
				append(span, text);
			},

			p(changed, ctx) {
				if ((changed.currEmoji) && text_value !== (text_value = ctx.currEmoji.icon)) {
					setData(text, text_value);
				}

				if (changed.currEmoji) {
					setStyle(div0, "border", "0.5rem solid " + ctx.currEmoji.color);
				}

				if (changed.sentiment) {
					setStyle(div0, "--sentiment", ctx.sentiment);
				}
			},

			i: noop,
			o: noop,

			d(detach) {
				if (detach) {
					detachNode(div1);
				}
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		const emojis = [
	    {
	      icon: '😠',
	      color: '#FF3939',
	    },
	    {
	      icon: '🙁',
	      color: '#FFA219',
	    },
	    {
	      icon: '😐',
	      color: '#FFF500',
	    },
	    {
	      icon: '🙂',
	      color: '#B3F81F',
	    },
	    {
	      icon: '😃',
	      color: '#41FF50',
	    },
	  ];
	  let currEmoji = emojis[0];
	  let { sentiment = 100 } = $$props;

	  beforeUpdate(() => {
	    const index = Math.floor(sentiment / 20);
	    currEmoji = emojis[index] ? emojis[index] : emojis[4]; $$invalidate('currEmoji', currEmoji);
	  });

		$$self.$set = $$props => {
			if ('sentiment' in $$props) $$invalidate('sentiment', sentiment = $$props.sentiment);
		};

		return { currEmoji, sentiment };
	}

	class Smilometer extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal);
		}

		get sentiment() {
			return this.$$.ctx.sentiment;
		}

		set sentiment(sentiment) {
			this.$set({ sentiment });
			flush();
		}
	}

	const ANALYTICS_AUTHORIZATION_ENDPOINT = '/api/analyticskey';
	const ANALYTICS_KEY_PHRASES_ENDPOINT =
	  'https://eastus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases';
	const ANALYTICS_SENTIMENT_ENDPOINT =
	  'https://eastus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';

	// ranking factors
	const KEY_PHRASE_WEIGHT = 18;
	const MONEY_WEIGHT = 5;
	const NUMERAL_WEIGHT = 4;
	const LENGTH_WEIGHT = 0.05;

	// best sentence filters
	const K_SCORE_THRESHOLD = 0.35;
	const MIN_ITEMS = 5;

	// increase to make sentiment more volatile
	const SENTIMENT_CHANGE_RATE = 0.2;

	const analyticsKey = fetch(ANALYTICS_AUTHORIZATION_ENDPOINT).then(req =>
	  req.text()
	);

	function processBestSentences(transcript) {
	  const taggedTranscript = transcript
	    .map((item, index) => ({ ...item, index }))
	    .filter(({ recognized }) => recognized);
	  const transcriptText = taggedTranscript
	    .map(({ recognized }) => recognized)
	    .join('\n');

	  analyticsKey
	    .then(key =>
	      fetch(ANALYTICS_KEY_PHRASES_ENDPOINT, {
	        method: 'POST',
	        headers: new Headers({
	          'Content-Type': 'application/json',
	          'Ocp-Apim-Subscription-Key': key,
	        }),
	        body: JSON.stringify({
	          documents: [
	            {
	              language: 'en',
	              id: '1',
	              text: transcriptText,
	            },
	          ],
	        }),
	      })
	    )
	    .then(req => req.json())
	    .then(res => {
	      const { keyPhrases } = res.documents[0];
	      const sentenceMap = getSentenceRanks(taggedTranscript, keyPhrases);
	      const bestSentences = getNBestSentences(sentenceMap, taggedTranscript);
	      const sentenceIdxs = new Set(bestSentences.map(({ index }) => index));
	      taggedTranscript.forEach((_, i) => {
	        transcript[i].important = sentenceIdxs.has(i);
	      });
	    });
	}

	function processSentiment(customerTranscript) {
	  return analyticsKey
	    .then(key =>
	      fetch(ANALYTICS_SENTIMENT_ENDPOINT, {
	        method: 'POST',
	        headers: new Headers({
	          'Content-Type': 'application/json',
	          'Ocp-Apim-Subscription-Key': key,
	        }),
	        body: JSON.stringify({
	          documents: [
	            {
	              language: 'en',
	              id: '1',
	              text: customerTranscript[customerTranscript.length - 1].recognized,
	            },
	          ],
	        }),
	      })
	    )
	    .then(req => req.json())
	    .then(res => {
	      const currSentiment = res.documents[0].score;
	      if (customerTranscript.length > 1) {
	        const prevSentiment =
	          customerTranscript[customerTranscript.length - 2].sentiment;
	        customerTranscript[customerTranscript.length - 1].sentiment =
	          SENTIMENT_CHANGE_RATE * currSentiment +
	          (1 - SENTIMENT_CHANGE_RATE) * prevSentiment;
	      } else {
	        customerTranscript[0].sentiment = currSentiment;
	      }
	      return customerTranscript[customerTranscript.length - 1].sentiment
	    })
	}

	function escapeRegExp(str) {
	  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
	}

	function getSentenceRanks(transcript, keyPhrases) {
	  keyPhrases = keyPhrases.map((keyPhrase, i) => ({
	    regex: new RegExp(`\\b${escapeRegExp(keyPhrase)}\\b`, 'g'),
	    weight: KEY_PHRASE_WEIGHT * Math.pow(1 - i / keyPhrases.length, 3),
	  }));

	  const sentencesDict = new Map();
	  transcript.forEach(({ recognized, index }) => {
	    let score = 0;
	    keyPhrases.forEach(({ regex, weight }) => {
	      score += (recognized.match(regex) || []).length * weight;
	    });
	    score += /\d/.test(recognized) * NUMERAL_WEIGHT;
	    score += /\$|\bdollars?\b|\bmoney\b/.test(recognized) * MONEY_WEIGHT;
	    score += recognized.length * LENGTH_WEIGHT;
	    sentencesDict.set(index, score);
	  });

	  return sentencesDict
	}

	function getNBestSentences(sentenceMap, transcript) {
	  const sentenceTuples = Array.from(sentenceMap.entries()).sort(
	    (a, b) => b[1] - a[1]
	  );
	  let filtered = sentenceTuples.filter(
	    ([i, score]) => score >= K_SCORE_THRESHOLD * transcript.length
	  );
	  if (filtered.length < MIN_ITEMS) {
	    filtered = sentenceTuples.slice(0, MIN_ITEMS);
	  }
	  filtered = filtered
	    .sort((a, b) => a[0] - b[0])
	    .map(([k, v]) => ({ ...transcript[k], score: v }));

	  return filtered
	}

	/* src/transcript.html generated by Svelte v3.0.0-beta.3 */

	function get_each_context_1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.entry = list[i];
		return child_ctx;
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.transcript = list[i];
		child_ctx.index = i;
		return child_ctx;
	}

	// (4:4) {#if index < transcripts.length - 1}
	function create_if_block(ctx) {
		var div, p, text0, text1_value = ctx.index + 1, text1, text2, button0, text3, button1, text4, button1_class_value, text5, button2, text6, button2_class_value, dispose;

		function click_handler() {
			return ctx.click_handler(ctx);
		}

		function click_handler_1() {
			return ctx.click_handler_1(ctx);
		}

		function click_handler_2() {
			return ctx.click_handler_2(ctx);
		}

		return {
			c() {
				div = createElement("div");
				p = createElement("p");
				text0 = createText("Transcript ");
				text1 = createText(text1_value);
				text2 = createText("\n      ");
				button0 = createElement("button");
				text3 = createText("\n    ");
				button1 = createElement("button");
				text4 = createText("Highlights");
				text5 = createText("\n    ");
				button2 = createElement("button");
				text6 = createText("View all");
				button0.className = "close svelte-f4ere6";
				div.className = "header svelte-f4ere6";
				button1.className = button1_class_value = "toggle " + (ctx.transcript.viewAll ? '' : 'selected') + " svelte-f4ere6";
				button2.className = button2_class_value = "toggle " + (ctx.transcript.viewAll ? 'selected' : '') + " svelte-f4ere6";

				dispose = [
					addListener(button0, "click", click_handler),
					addListener(button1, "click", click_handler_1),
					addListener(button2, "click", click_handler_2)
				];
			},

			m(target, anchor) {
				insert(target, div, anchor);
				append(div, p);
				append(p, text0);
				append(p, text1);
				append(div, text2);
				append(div, button0);
				insert(target, text3, anchor);
				insert(target, button1, anchor);
				append(button1, text4);
				insert(target, text5, anchor);
				insert(target, button2, anchor);
				append(button2, text6);
			},

			p(changed, new_ctx) {
				ctx = new_ctx;
				if ((changed.transcripts) && button1_class_value !== (button1_class_value = "toggle " + (ctx.transcript.viewAll ? '' : 'selected') + " svelte-f4ere6")) {
					button1.className = button1_class_value;
				}

				if ((changed.transcripts) && button2_class_value !== (button2_class_value = "toggle " + (ctx.transcript.viewAll ? 'selected' : '') + " svelte-f4ere6")) {
					button2.className = button2_class_value;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div);
					detachNode(text3);
					detachNode(button1);
					detachNode(text5);
					detachNode(button2);
				}

				run_all(dispose);
			}
		};
	}

	// (12:4) {#each transcript.transcriptBlocks as entry}
	function create_each_block_1(ctx) {
		var div, p0, text0_value = ctx.capitalize(ctx.entry.speaker), text0, text1, p1, span0, text2_value = ctx.entry.recognized, text2, text3, span1, text4_value = ctx.entry.recognizing, text4, div_class_value;

		return {
			c() {
				div = createElement("div");
				p0 = createElement("p");
				text0 = createText(text0_value);
				text1 = createText("\n      ");
				p1 = createElement("p");
				span0 = createElement("span");
				text2 = createText(text2_value);
				text3 = createText("\n        ");
				span1 = createElement("span");
				text4 = createText(text4_value);
				p0.className = "label svelte-f4ere6";
				span1.className = "recognizing svelte-f4ere6";
				p1.className = "svelte-f4ere6";
				div.className = div_class_value = "entry-container " + (!ctx.transcript.viewAll && !ctx.entry.important ? 'hidden' : '') + " " + (!ctx.entry.important ? 'dim' : '') + " svelte-f4ere6";
			},

			m(target, anchor) {
				insert(target, div, anchor);
				append(div, p0);
				append(p0, text0);
				append(div, text1);
				append(div, p1);
				append(p1, span0);
				append(span0, text2);
				append(p1, text3);
				append(p1, span1);
				append(span1, text4);
			},

			p(changed, ctx) {
				if ((changed.transcripts) && text0_value !== (text0_value = ctx.capitalize(ctx.entry.speaker))) {
					setData(text0, text0_value);
				}

				if ((changed.transcripts) && text2_value !== (text2_value = ctx.entry.recognized)) {
					setData(text2, text2_value);
				}

				if ((changed.transcripts) && text4_value !== (text4_value = ctx.entry.recognizing)) {
					setData(text4, text4_value);
				}

				if ((changed.transcripts) && div_class_value !== (div_class_value = "entry-container " + (!ctx.transcript.viewAll && !ctx.entry.important ? 'hidden' : '') + " " + (!ctx.entry.important ? 'dim' : '') + " svelte-f4ere6")) {
					div.className = div_class_value;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	// (2:2) {#each transcripts as transcript, index}
	function create_each_block(ctx) {
		var section, text, section_class_value;

		var if_block = (ctx.index < ctx.transcripts.length - 1) && create_if_block(ctx);

		var each_value_1 = ctx.transcript.transcriptBlocks;

		var each_blocks = [];

		for (var i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		return {
			c() {
				section = createElement("section");
				if (if_block) if_block.c();
				text = createText("\n    ");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				section.className = section_class_value = "" + (ctx.transcript.collapsed ? 'collapsed' : '') + " svelte-f4ere6";
			},

			m(target, anchor) {
				insert(target, section, anchor);
				if (if_block) if_block.m(section, null);
				append(section, text);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(section, null);
				}
			},

			p(changed, ctx) {
				if (ctx.index < ctx.transcripts.length - 1) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(section, text);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (changed.transcripts || changed.capitalize) {
					each_value_1 = ctx.transcript.transcriptBlocks;

					for (var i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(section, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value_1.length;
				}

				if ((changed.transcripts) && section_class_value !== (section_class_value = "" + (ctx.transcript.collapsed ? 'collapsed' : '') + " svelte-f4ere6")) {
					section.className = section_class_value;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(section);
				}

				if (if_block) if_block.d();

				destroyEach(each_blocks, detach);
			}
		};
	}

	function create_fragment$1(ctx) {
		var main, text, div, current;

		var each_value = ctx.transcripts;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		var smilometer = new Smilometer({ props: { sentiment: ctx.sentiment } });

		return {
			c() {
				main = createElement("main");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				text = createText("\n  ");
				div = createElement("div");
				smilometer.$$.fragment.c();
				div.className = "smilometer-container svelte-f4ere6";
				main.className = "svelte-f4ere6";
			},

			m(target, anchor) {
				insert(target, main, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(main, null);
				}

				append(main, text);
				append(main, div);
				mount_component(smilometer, div, null);
				current = true;
			},

			p(changed, ctx) {
				if (changed.transcripts || changed.capitalize) {
					each_value = ctx.transcripts;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(main, text);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				var smilometer_changes = {};
				if (changed.sentiment) smilometer_changes.sentiment = ctx.sentiment;
				smilometer.$set(smilometer_changes);
			},

			i(local) {
				if (current) return;
				smilometer.$$.fragment.i(local);

				current = true;
			},

			o(local) {
				smilometer.$$.fragment.o(local);
				current = false;
			},

			d(detach) {
				if (detach) {
					detachNode(main);
				}

				destroyEach(each_blocks, detach);

				smilometer.$destroy();
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		

	  let transcripts = [{transcriptBlocks: []}];
	  let sentiment = 50;

	  const capitalize = word =>
	    word && word.length ? word[0].toUpperCase() + word.slice(1) : '';

	  let lastLogs = {};

	  const expandTranscript = index => { const $$result = transcripts[index].collapsed = !transcripts[index].collapsed; $$invalidate('transcripts', transcripts); return $$result; };

	  const toggleTranscriptView = (viewAll, index) => { const $$result = transcripts[index].viewAll = viewAll; $$invalidate('transcripts', transcripts); return $$result; };

	  onMount(() => {
	    const socket = new WebSocket(
	      `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/speech/recv`
	    );

	    socket.onmessage = event => {
	      let transcript = transcripts[transcripts.length - 1].transcriptBlocks;
	      transcripts[transcripts.length - 1].collapsed = false; $$invalidate('transcripts', transcripts);
	      transcripts[transcripts.length - 1].viewAll = true; $$invalidate('transcripts', transcripts);

	      const { speaker, type, result } = JSON.parse(event.data);
	      const lastEntry = transcript.length
	        ? transcript[transcript.length - 1]
	        : {};

	      if (lastEntry.speaker === speaker) {
	        lastLogs[speaker] = lastEntry; $$invalidate('lastLogs', lastLogs);
	      }

	      if (type === 'transfer') {
	        if (lastLogs['agent']){
	          lastLogs['agent'].recognizing = ''; $$invalidate('lastLogs', lastLogs);
	        }
	        if (lastLogs['customer']) {
	          lastLogs['customer'].recognizing = ''; $$invalidate('lastLogs', lastLogs);
	        }
	        transcripts[transcripts.length - 1].collapsed = true; $$invalidate('transcripts', transcripts);
	        transcripts[transcripts.length - 1].viewAll = false; $$invalidate('transcripts', transcripts);
	        transcripts = [...transcripts, {transcriptBlocks: []}]; $$invalidate('transcripts', transcripts);
	        lastLogs = {}; $$invalidate('lastLogs', lastLogs);
	        return;
	      }

	      if (!lastLogs[speaker]) {
	        if (type === 'recognized') {
	          lastLogs[speaker] = {
	            speaker: speaker,
	            recognized: result,
	            recognizing: '',
	            important: true,
	          }; $$invalidate('lastLogs', lastLogs);
	        } else {
	          lastLogs[speaker] = {
	            speaker: speaker,
	            recognized: '',
	            recognizing: result,
	            important: true,
	          }; $$invalidate('lastLogs', lastLogs);
	        }
	        transcript.push(lastLogs[speaker]);
	      } else {
	        if (type === 'recognized') {
	          lastLogs[speaker].recognized += ' ' + result; $$invalidate('lastLogs', lastLogs);
	          lastLogs[speaker].recognizing = ''; $$invalidate('lastLogs', lastLogs);
	        } else {
	          lastLogs[speaker].recognizing = result; $$invalidate('lastLogs', lastLogs);
	        }
	      }

	      if (type === 'recognized') {
	        lastLogs[speaker] = undefined; $$invalidate('lastLogs', lastLogs);
	        processBestSentences(transcript);

	        if (speaker === 'customer') {
	          const customerTranscript
	            = transcript.filter(({ speaker }) => speaker === 'customer');
	          processSentiment(customerTranscript).then(sentimentDecimal =>
	            { const $$result = sentiment = sentimentDecimal * 100; $$invalidate('sentiment', sentiment); return $$result; }
	          );
	        }
	      }
	    };
	  });

		function click_handler({ index }) {
			return expandTranscript(index);
		}

		function click_handler_1({ index }) {
			return toggleTranscriptView(false, index);
		}

		function click_handler_2({ index }) {
			return toggleTranscriptView(true, index);
		}

		return {
			transcripts,
			sentiment,
			capitalize,
			expandTranscript,
			toggleTranscriptView,
			click_handler,
			click_handler_1,
			click_handler_2
		};
	}

	class Transcript extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$1, create_fragment$1, safe_not_equal);
		}
	}

	/* src/index.html generated by Svelte v3.0.0-beta.3 */

	function create_fragment$2(ctx) {
		var div, header, text_1, current;

		var transcript = new Transcript({});

		return {
			c() {
				div = createElement("div");
				header = createElement("header");
				header.textContent = "T-Gist Live Transcription";
				text_1 = createText("\n  ");
				transcript.$$.fragment.c();
				header.className = "svelte-19105im";
				div.className = "container svelte-19105im";
			},

			m(target, anchor) {
				insert(target, div, anchor);
				append(div, header);
				append(div, text_1);
				mount_component(transcript, div, null);
				current = true;
			},

			p: noop,

			i(local) {
				if (current) return;
				transcript.$$.fragment.i(local);

				current = true;
			},

			o(local) {
				transcript.$$.fragment.o(local);
				current = false;
			},

			d(detach) {
				if (detach) {
					detachNode(div);
				}

				transcript.$destroy();
			}
		};
	}

	class Index extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, null, create_fragment$2, safe_not_equal);
		}
	}

	const Main = new Index({
	  target: document.body,
	});

	return Main;

}());
