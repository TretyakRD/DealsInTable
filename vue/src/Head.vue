<template>
	<div class="container-fluid background">
		<div class="row py-3 px-4">
			<div class="col-4 pr-0 mr-0">
				<span>Дата</span>
				<input type="date" v-model="date_start">
				<span>–</span>
				<input type="date" v-model="date_stop">
			</div>
			<div class="col4 pl-0 ml-0 align-content-end">
				<span>Проект: </span>
				<input type="text" v-model="project">
			</div>
			<div class="col4">
				
			</div>
		</div>
		<div class="row py-3 px-2">
			<div class="col-12">
				<div class="container-fluid ">
					<div class="row">
						<div class="col-4 pr-0 mr-0">
							<span>Постановщик: </span>
							<input type="text" v-model="initiator">
						</div>
						<div class="col-4 pl-0 ml-0 align-content-end">
							<span>Ответственный: </span>
							<input type="text" v-model="respondent">
						</div>
						<div class="col-3">
							<button class="btn btn-block btn-outline-primary" @click="get_deals">Вывести</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data () {
    return {
    	date_start: "",
    	date_stop: "",
    	project: "",
    	initiator: "",
    	respondent: "",
    }
  },
  methods: {
  	get_deals: function(){

  			String.prototype.Dformat = function(){var tmp = new Date(Date.parse(this)); return tmp.getDate()+'.'+tmp.getMonth()+'.'+tmp.getFullYear();};

  			this.date_start = this.date_start.Dformat();

  			this.date_stop = this.date_stop.Dformat();

  			console.log(this._data);
  	},
  }
}
</script>

<style>
.background{
	background-color: #EEEEEE;
	font-weight: 600;
}
</style>