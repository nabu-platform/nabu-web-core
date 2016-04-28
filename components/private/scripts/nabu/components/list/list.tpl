<template id="n-list">
	<div class="n-list" v-store:previous="previous" v-store:next="next" v-store:toggle="toggle">
		<slot name="previous" v-if="hasPrevious">
			<button v-on:click="previous()"><slot name="previousLabel">previous</slot></button>
		</slot>
		<div class="n-list-items">
			<div class="n-list-item" v-for="item in selected" :class="{ 'active' : activated(item)}" v-store="item">
				<slot>
					<n-img :src="item.image" v-on:click="toggle(item)"></n-img>
					<div class="caption">{{ item.caption }}</div>
				</slot>
			</div>
		</div>
		<slot name="next" v-if="hasNext">
			<button v-on:click="next()"><slot name="nextLabel">next</slot></button>
		</slot>
	</div>
</template>
