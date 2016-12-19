<template id="n-menu">
	<div class="n-menu">
		<ul>
			<li v-on:mouseOver="toggle(item)" v-on:mouseOut="toggle(item)" v-for="item in items" :class="{ 'active' : activated(item), 'inactive': !activated(item), 'parent': item.children, 'child': !item.children }" v-if="!item.disabled || !item.disabled()">
				<a v-if="!item.children" href="javascript:void(0)" v-on:click="item.handle()" :class="{ 'image-link': item.image }">
					<span v-if="!item.image">{{ item.title }}</span>
					<span v-if="item.image"><img :src="item.image"/></span>
				</a>
				<a v-if="item.children" class="dropdown" href="javascript:void(0)">{{ item.title }}</a>
				<n-menu v-if="item.children" :items="item.children"></n-menu>
			</li>
		</ul>
	</div>
</template>