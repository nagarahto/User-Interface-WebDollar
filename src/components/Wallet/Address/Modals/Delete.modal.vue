<template>

    <div>

        <Modal title="Delete Address" ref="refModal">

            <div slot="content">

                <div class="descriptionText">

                    To delete this address please type <span class="coloredText">DELETE</span>

                </div>

                <div >

                    <input v-model="inputValue" class="inputDeleteModal"/>

                    <div @click="this.deleteAddress" class="modalButton">
                        Delete
                    </div>

                </div>

            </div>

        </Modal>

    </div>

</template>

<script>

    let Vue = require('vue/dist/vue.min.js');
    import Modal from "components/UI/modal/Modal.vue"

    import Clipboard from './../../../../../node_modules/v-clipboard'

    Vue.use(Clipboard);

    export default {

        props: {
            address: {default: null},
            toAddress: {default: null},
            toAmount: {default: 0.0},

        },

        components: {
            "Modal":Modal,
        },

        data: () => {
            return {
                inputValue: ''
            }
        },

        methods: {

            async deleteAddress(){

                if (this.inputValue.toUpperCase().trim().toUpperCase() === 'DELETE'){

                    // WebDollar.Blockchain.wallet. - DELETE
                    let answer = await WebDollar.Blockchain.Wallet.deleteAddress(this.address);
                    console.log(answer);
                }

                this.closeModal();

            },

            closeModal(e) {
                this.inputValue = "";
                if (this.$refs['refModal'] !== undefined)
                    this.$refs['refModal'].closeModal(e);
            },

            showModal(e) {

                if (this.$refs['refModal'].modalOpened === false){
                    console.log("shooow modal");
                    this.$refs['refModal'].showModal(e);
                }

            }

        },

        mounted() {

            if (typeof window === 'undefined') return;

        },

    }

</script>

<style>

    .descriptionText{

        color: #bdbdbd;
        padding: 30px 10px;

    }

    .inputDeleteModal{
        width: 90%;
        background-color: #2d2d2d;
        border: solid 1px #565656;
        margin: 0 auto;
        left: 0;
        right: 0;
        color: #ccc;
        padding: 7px;
        font-weight: 100;
        text-align: center;
        font-size: 14px;
        margin-bottom: 20px;
    }

    .modalButton{
        background-color: #131313;
        color: #969696;
        font-size: 12px;
        width: 140px;
        border: solid 1px #5f5d5d;
        font-weight: bolder;
        border-radius: 5px;
        letter-spacing: 2px;
        text-transform: uppercase;
        padding: 8px;
        margin: 0 auto;
        margin-bottom: 20px;
        transition: all .3s linear;
    }

    .modalButton:hover{
        background-color: #f6ba2c;
        color: #000000;
        transition: all .3s linear;
    }

    .coloredText{
        color: #f6ba2c;
    }

</style>

