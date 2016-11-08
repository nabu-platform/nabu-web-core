<template id="n-menu">
	<div class="n-menu">
		<ul>
			<li v-for="item in items" :class="{ 'active' : activated(item), 'inactive': !activated(item)}" v-if="!item.disabled || !item.disabled()">
				<a v-if="!item.children" href="javascript:void(0)" v-on:click="item.handle()" :class="{ 'image-link': item.image }">
					<span v-if="!item.image">{{ item.title }}</span>
					<span v-if="item.image"><img :src="item.image"/></span>
				</a>
				<a v-if="item.children" class="dropdown" href="javascript:void(0)" v-on:click="toggle(item)">{{ item.title }}</a>
				<n-menu v-if="item.children" :items="item.children"></n-menu>
			</li>
		</ul>
	</div>
</template>